-- 모두의 OX: RPC 함수
-- 참고: C:\Users\G00210\.claude\plans\greedy-inventing-river.md §3, §5
--
-- 모든 함수는 security definer + search_path 고정으로 생성한다.
-- 클라이언트의 직접 INSERT/UPDATE/DELETE는 0002_rls.sql에서 전부 막혀
-- 있으므로, 상태 전이와 판정 로직은 이 함수들을 통해서만 이루어진다.

-- ── 시간 상수 헬퍼(매직 넘버 방지, 프론트엔드 constants.ts와 대응) ─────
create or replace function public.round_duration() returns interval
  language sql immutable as $$ select interval '10 seconds' $$;

create or replace function public.submission_grace() returns interval
  language sql immutable as $$ select interval '1.5 seconds' $$;

create or replace function public.host_missing_timeout() returns interval
  language sql immutable as $$ select interval '30 seconds' $$;

create or replace function public.combo_release_timeout() returns interval
  language sql immutable as $$ select interval '60 seconds' $$;

create or replace function public.room_retention() returns interval
  language sql immutable as $$ select interval '24 hours' $$;

-- ── server_now ───────────────────────────────────────────────
-- 클라이언트가 자신의 clock offset을 계산하기 위해 호출한다.
create or replace function public.server_now()
returns timestamptz
language sql
stable
as $$ select now(); $$;

-- ── create_room ──────────────────────────────────────────────────────
create or replace function public.create_room(p_title text, p_questions jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
  v_code text;
  v_question jsonb;
  v_idx integer := 0;
  v_question_id uuid;
  v_attempt integer := 0;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;
  if char_length(p_title) < 1 or char_length(p_title) > 60 then
    raise exception 'INVALID_TITLE';
  end if;
  if jsonb_array_length(p_questions) < 3 then
    raise exception 'NOT_ENOUGH_QUESTIONS';
  end if;

  for v_question in select * from jsonb_array_elements(p_questions)
  loop
    if char_length(v_question->>'text') < 1 or char_length(v_question->>'text') > 100 then
      raise exception 'INVALID_QUESTION_TEXT';
    end if;
    if v_question->>'correct_answer' is not null and v_question->>'correct_answer' not in ('O', 'X') then
      raise exception 'INVALID_CORRECT_ANSWER';
    end if;
  end loop;

  v_room_id := gen_random_uuid();

  loop
    v_code := lpad(floor(random() * 1000000)::text, 6, '0');
    v_attempt := v_attempt + 1;
    begin
      insert into rooms (id, code, title, host_id, status)
      values (v_room_id, v_code, p_title, auth.uid(), 'LOBBY');
      exit;
    exception when unique_violation then
      if v_attempt >= 20 then
        raise exception 'CODE_GENERATION_FAILED';
      end if;
    end;
  end loop;

  for v_question in select * from jsonb_array_elements(p_questions)
  loop
    v_question_id := gen_random_uuid();
    insert into questions (id, room_id, idx, text)
    values (v_question_id, v_room_id, v_idx, v_question->>'text');
    insert into question_secrets (question_id, room_id, correct_answer)
    values (v_question_id, v_room_id, v_question->>'correct_answer');
    v_idx := v_idx + 1;
  end loop;

  return jsonb_build_object('room_id', v_room_id, 'code', v_code);
end;
$$;

-- ── join_room ───────────────────────────────────────────────────────
-- 72콤보 충돌의 실제 방어선은 players_combo_unique_idx(0001_schema.sql)다.
-- 여기서는 그 제약 위반을 사람이 읽을 수 있는 에러 코드로 변환할 뿐이다.
create or replace function public.join_room(
  p_code text,
  p_nickname text,
  p_character_id smallint,
  p_color_id smallint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
  v_status text;
  v_current_idx integer;
  v_max_players integer;
  v_active_count integer;
  v_player_id uuid;
  v_spectator_idx integer;
  v_constraint text;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select id, status, current_question_index, max_players
  into v_room_id, v_status, v_current_idx, v_max_players
  from rooms where code = p_code and status <> 'FINISHED';

  if v_room_id is null then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  if char_length(p_nickname) < 1 or char_length(p_nickname) > 8 then
    raise exception 'INVALID_NICKNAME';
  end if;
  if p_character_id < 1 or p_character_id > 12 then
    raise exception 'INVALID_CHARACTER';
  end if;
  if p_color_id < 1 or p_color_id > 6 then
    raise exception 'INVALID_COLOR';
  end if;

  select count(*) into v_active_count
  from players where room_id = v_room_id and character_id is not null;

  if v_active_count >= v_max_players then
    raise exception 'ROOM_FULL';
  end if;

  if v_status in ('QUESTION_ACTIVE', 'QUESTION_LOCKED', 'REVEAL') then
    v_spectator_idx := v_current_idx;
  else
    v_spectator_idx := null;
  end if;

  begin
    insert into players (room_id, user_id, nickname, character_id, color_id, is_spectator_for_question_idx)
    values (v_room_id, auth.uid(), p_nickname, p_character_id, p_color_id, v_spectator_idx)
    returning id into v_player_id;
  exception when unique_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint = 'players_room_id_nickname_key' then
      raise exception 'NICKNAME_TAKEN';
    elsif v_constraint = 'players_combo_unique_idx' then
      raise exception 'COMBO_TAKEN';
    elsif v_constraint = 'players_room_id_user_id_key' then
      raise exception 'ALREADY_JOINED';
    else
      raise;
    end if;
  end;

  return jsonb_build_object(
    'player_id', v_player_id,
    'room_id', v_room_id,
    'is_spectator', v_spectator_idx is not null,
    'room_status', v_status,
    'server_now', now()
  );
end;
$$;

-- ── rejoin_room ───────────────────────────────────────────────────
-- 새로고침/재접속 복귀 전용. 닉네임/콤보를 다시 제출할 필요가 없다.
create or replace function public.rejoin_room(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
  v_status text;
  v_player record;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select id, status into v_room_id, v_status from rooms where code = p_code;
  if v_room_id is null then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  select * into v_player from players where room_id = v_room_id and user_id = auth.uid();
  if v_player.id is null then
    raise exception 'PLAYER_NOT_FOUND';
  end if;

  update players set disconnected_at = null where id = v_player.id;

  return jsonb_build_object(
    'player_id', v_player.id,
    'room_id', v_room_id,
    'nickname', v_player.nickname,
    'character_id', v_player.character_id,
    'color_id', v_player.color_id,
    'room_status', v_status,
    'server_now', now()
  );
end;
$$;

-- ── reassign_combo ──────────────────────────────────────────────
-- 콤보가 해제(60초 경과)된 후 재접속한 플레이어의 새 콤보 선택.
create or replace function public.reassign_combo(
  p_player_id uuid,
  p_character_id smallint,
  p_color_id smallint
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select user_id into v_user_id from players where id = p_player_id;
  if v_user_id is null then
    raise exception 'PLAYER_NOT_FOUND';
  end if;
  if v_user_id <> auth.uid() then
    raise exception 'NOT_YOUR_PLAYER';
  end if;

  if p_character_id < 1 or p_character_id > 12 then
    raise exception 'INVALID_CHARACTER';
  end if;
  if p_color_id < 1 or p_color_id > 6 then
    raise exception 'INVALID_COLOR';
  end if;

  begin
    update players set character_id = p_character_id, color_id = p_color_id where id = p_player_id;
  exception when unique_violation then
    raise exception 'COMBO_TAKEN';
  end;

  return jsonb_build_object('player_id', p_player_id, 'character_id', p_character_id, 'color_id', p_color_id);
end;
$$;

-- ── start_game ──────────────────────────────────────────────────────
create or replace function public.start_game(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid;
  v_status text;
  v_ends_at timestamptz;
begin
  select host_id, status into v_host_id, v_status from rooms where id = p_room_id for update;
  if v_host_id is null then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_host_id <> auth.uid() then
    raise exception 'NOT_HOST';
  end if;
  if v_status <> 'LOBBY' then
    raise exception 'INVALID_STATE';
  end if;

  v_ends_at := now() + round_duration();

  update rooms
  set status = 'QUESTION_ACTIVE',
      current_question_index = 0,
      question_ends_at = v_ends_at,
      started_at = now(),
      last_activity_at = now()
  where id = p_room_id;

  return jsonb_build_object('status', 'QUESTION_ACTIVE', 'question_ends_at', v_ends_at);
end;
$$;

-- ── lock_question ──────────────────────────────────────────────
-- 호스트가 누르는 "잠금" 버튼은 없다. 마감 시각이 지났음을 감지한 아무
-- 클라이언트나 호출하며, 서버가 now() >= question_ends_at을 재검증한다.
create or replace function public.lock_question(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_ends_at timestamptz;
begin
  select status, question_ends_at into v_status, v_ends_at from rooms where id = p_room_id for update;
  if v_status is null then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_status = 'QUESTION_LOCKED' then
    return jsonb_build_object('status', 'QUESTION_LOCKED');
  end if;
  if v_status <> 'QUESTION_ACTIVE' then
    raise exception 'INVALID_STATE';
  end if;
  if now() < v_ends_at then
    raise exception 'TOO_EARLY';
  end if;

  update rooms
  set status = 'QUESTION_LOCKED', question_locked_at = now(), last_activity_at = now()
  where id = p_room_id;

  return jsonb_build_object('status', 'QUESTION_LOCKED');
end;
$$;

-- ── submit_answer ──────────────────────────────────────────────
-- 판정(judged_answer)은 클라이언트 값을 신뢰하지 않고 x_position으로부터
-- 서버에서 직접 계산한다. 시간 판단도 서버의 now()만 사용한다.
create or replace function public.submit_answer(
  p_room_id uuid,
  p_question_id uuid,
  p_x_position real
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player_id uuid;
  v_spectator_idx integer;
  v_room_status text;
  v_current_idx integer;
  v_ends_at timestamptz;
  v_question_idx integer;
  v_judged text;
begin
  select id, is_spectator_for_question_idx into v_player_id, v_spectator_idx
  from players where room_id = p_room_id and user_id = auth.uid();

  if v_player_id is null then
    raise exception 'NOT_A_PLAYER';
  end if;

  select status, current_question_index, question_ends_at
  into v_room_status, v_current_idx, v_ends_at
  from rooms where id = p_room_id;

  if v_room_status <> 'QUESTION_ACTIVE' then
    raise exception 'SUBMISSION_CLOSED';
  end if;

  select idx into v_question_idx from questions where id = p_question_id and room_id = p_room_id;
  if v_question_idx is null or v_question_idx <> v_current_idx then
    raise exception 'WRONG_QUESTION';
  end if;

  if v_spectator_idx is not null and v_spectator_idx = v_current_idx then
    raise exception 'SPECTATOR_NOT_ELIGIBLE';
  end if;

  if now() > v_ends_at + submission_grace() then
    raise exception 'SUBMISSION_CLOSED';
  end if;

  if p_x_position < 0 or p_x_position > 1 then
    raise exception 'INVALID_POSITION';
  end if;

  v_judged := case
    when p_x_position < 0.4 then 'O'
    when p_x_position > 0.6 then 'X'
    else null
  end;

  insert into answers (room_id, question_id, player_id, x_position, judged_answer, submitted_at)
  values (p_room_id, p_question_id, v_player_id, p_x_position, v_judged, now())
  on conflict (question_id, player_id)
  do update set x_position = excluded.x_position, judged_answer = excluded.judged_answer, submitted_at = now();

  return jsonb_build_object('judged_answer', v_judged, 'accepted_at', now());
end;
$$;

-- ── reveal_question ───────────────────────────────────────────
create or replace function public.reveal_question(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid;
  v_status text;
  v_current_idx integer;
  v_question_id uuid;
  v_correct text;
  v_results jsonb;
begin
  select host_id, status, current_question_index into v_host_id, v_status, v_current_idx
  from rooms where id = p_room_id for update;

  if v_host_id is null then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_host_id <> auth.uid() then
    raise exception 'NOT_HOST';
  end if;
  if v_status <> 'QUESTION_LOCKED' then
    raise exception 'INVALID_STATE';
  end if;

  select id into v_question_id from questions where room_id = p_room_id and idx = v_current_idx;
  select correct_answer into v_correct from question_secrets where question_id = v_question_id;

  -- 관전자가 아니었던 플레이어 중 제출 기록이 없는 사람은 무응답(오답)으로 보정한다.
  insert into answers (room_id, question_id, player_id, x_position, judged_answer, submitted_at)
  select p_room_id, v_question_id, p.id, null, null, now()
  from players p
  where p.room_id = p_room_id
    and (p.is_spectator_for_question_idx is null or p.is_spectator_for_question_idx <> v_current_idx)
    and p.character_id is not null
    and not exists (
      select 1 from answers a where a.question_id = v_question_id and a.player_id = p.id
    );

  update question_secrets set revealed = true, revealed_at = now() where question_id = v_question_id;

  update answers
  set is_correct = (judged_answer is not null and v_correct is not null and judged_answer = v_correct)
  where question_id = v_question_id;

  update players p
  set score = score + 1
  from answers a
  where a.question_id = v_question_id and a.player_id = p.id and a.is_correct = true;

  update rooms set status = 'REVEAL', last_activity_at = now() where id = p_room_id;

  select jsonb_agg(jsonb_build_object(
    'player_id', a.player_id, 'judged_answer', a.judged_answer, 'is_correct', a.is_correct
  )) into v_results
  from answers a where a.question_id = v_question_id;

  return jsonb_build_object('correct_answer', v_correct, 'results', coalesce(v_results, '[]'::jsonb));
end;
$$;

-- ── next_question ──────────────────────────────────────────────
-- 다음 질문이 없으면 자동으로 FINISHED로 전환한다(호스트가 별도 분기를
-- 다루 필요 없음). end_game은 조기 종료를 위한 별도 명시적 RPC로 유지.
create or replace function public.next_question(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid;
  v_status text;
  v_current_idx integer;
  v_total integer;
  v_next_idx integer;
  v_ends_at timestamptz;
begin
  select host_id, status, current_question_index into v_host_id, v_status, v_current_idx
  from rooms where id = p_room_id for update;

  if v_host_id is null then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_host_id <> auth.uid() then
    raise exception 'NOT_HOST';
  end if;
  if v_status <> 'REVEAL' then
    raise exception 'INVALID_STATE';
  end if;

  select count(*) into v_total from questions where room_id = p_room_id;
  v_next_idx := v_current_idx + 1;

  if v_next_idx >= v_total then
    update rooms set status = 'FINISHED', finished_at = now(), last_activity_at = now()
    where id = p_room_id;
    return jsonb_build_object('status', 'FINISHED');
  end if;

  v_ends_at := now() + round_duration();

  update rooms
  set status = 'QUESTION_ACTIVE',
      current_question_index = v_next_idx,
      question_ends_at = v_ends_at,
      question_locked_at = null,
      last_activity_at = now()
  where id = p_room_id;

  update players
  set is_spectator_for_question_idx = null
  where room_id = p_room_id
    and is_spectator_for_question_idx is not null
    and is_spectator_for_question_idx < v_next_idx;

  return jsonb_build_object('status', 'QUESTION_ACTIVE', 'current_question_index', v_next_idx, 'question_ends_at', v_ends_at);
end;
$$;

-- ── end_game ──────────────────────────────────────────────────────
create or replace function public.end_game(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_host_id uuid;
  v_status text;
  v_ranking jsonb;
begin
  select host_id, status into v_host_id, v_status from rooms where id = p_room_id for update;
  if v_host_id is null then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_host_id <> auth.uid() then
    raise exception 'NOT_HOST';
  end if;
  if v_status = 'FINISHED' then
    raise exception 'ALREADY_FINISHED';
  end if;

  update rooms set status = 'FINISHED', finished_at = now(), last_activity_at = now() where id = p_room_id;

  select jsonb_agg(jsonb_build_object(
    'player_id', id, 'nickname', nickname, 'character_id', character_id, 'color_id', color_id, 'score', score
  ) order by score desc) into v_ranking
  from players where room_id = p_room_id;

  return jsonb_build_object('ranking', coalesce(v_ranking, '[]'::jsonb));
end;
$$;

-- ── mark_player_disconnected ────────────────────────────────
create or replace function public.mark_player_disconnected(p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
  v_caller_in_room boolean;
begin
  select room_id into v_room_id from players where id = p_player_id;
  if v_room_id is null then
    raise exception 'PLAYER_NOT_FOUND';
  end if;

  select
    exists(select 1 from players where room_id = v_room_id and user_id = auth.uid())
    or exists(select 1 from rooms where id = v_room_id and host_id = auth.uid())
  into v_caller_in_room;

  if not v_caller_in_room then
    raise exception 'NOT_IN_ROOM';
  end if;

  update players set disconnected_at = now()
  where id = p_player_id and disconnected_at is null;
end;
$$;

-- ── release_abandoned_combos ────────────────────────────────
-- code로 받는다(room_id 아님) — CharacterSelect의 미가입 방문자는 아직
-- players 행이 없어 rooms를 직접 SELECT할 수 없으므로 room_id를 모른다.
create or replace function public.release_abandoned_combos(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room_id uuid;
  v_released jsonb;
begin
  select id into v_room_id from rooms where code = p_code;
  if v_room_id is null then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  with released as (
    update players
    set character_id = null, color_id = null
    where room_id = v_room_id
      and disconnected_at is not null
      and disconnected_at < now() - combo_release_timeout()
      and character_id is not null
    returning character_id, color_id
  )
  select jsonb_agg(jsonb_build_object('character_id', character_id, 'color_id', color_id)) into v_released
  from released;

  return jsonb_build_object('released', coalesce(v_released, '[]'::jsonb));
end;
$$;

-- ── migrate_host ───────────────────────────────────────────────────
-- p_expected_current_host로 이중 호출(여러 클라이언트의 타이머가 동시에
-- 만료)을 안전하게 구분한다: 이미 이전된 뒤의 재호출은 HOST_ALREADY_MIGRATED.
create or replace function public.migrate_host(p_room_id uuid, p_expected_current_host uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_host uuid;
  v_host_disconnected_at timestamptz;
  v_successor record;
begin
  select host_id into v_current_host from rooms where id = p_room_id for update;
  if v_current_host is null then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_current_host <> p_expected_current_host then
    raise exception 'HOST_ALREADY_MIGRATED';
  end if;

  select disconnected_at into v_host_disconnected_at
  from players where room_id = p_room_id and user_id = v_current_host;

  if v_host_disconnected_at is null or v_host_disconnected_at > now() - host_missing_timeout() then
    raise exception 'HOST_STILL_ACTIVE';
  end if;

  select id, user_id into v_successor
  from players
  where room_id = p_room_id and user_id <> v_current_host and disconnected_at is null
  order by joined_at asc
  limit 1;

  if v_successor.user_id is null then
    update rooms set status = 'FINISHED', finished_at = now(), last_activity_at = now() where id = p_room_id;
    return jsonb_build_object('status', 'FINISHED', 'reason', 'NO_SUCCESSOR');
  end if;

  update rooms set host_id = v_successor.user_id, last_activity_at = now() where id = p_room_id;

  return jsonb_build_object('new_host_user_id', v_successor.user_id, 'new_host_player_id', v_successor.id);
end;
$$;

-- ── cleanup_finished_rooms ─────────────────────────────────────
-- 클라이언트 EXECUTE 권한 없음. pg_cron(0004_cron.sql) 또는 수동 실행 전용.
create or replace function public.cleanup_finished_rooms()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_finished_count integer;
  v_abandoned_count integer;
begin
  with deleted as (
    delete from rooms
    where status = 'FINISHED' and finished_at < now() - room_retention()
    returning id
  )
  select count(*) into v_finished_count from deleted;

  with deleted as (
    delete from rooms
    where status <> 'FINISHED' and last_activity_at < now() - room_retention()
    returning id
  )
  select count(*) into v_abandoned_count from deleted;

  return jsonb_build_object('finished_deleted', v_finished_count, 'abandoned_deleted', v_abandoned_count);
end;
$$;

-- ── 실행 권한 ─────────────────────────────────────────────────────────
-- Postgres는 새 함수의 EXECUTE를 기본적으로 PUBLIC에 부여하므로,
-- 명시적으로 걸어내고 필요한 role에만 다시 부여한다.
revoke execute on function
  public.server_now(),
  public.create_room(text, jsonb),
  public.join_room(text, text, smallint, smallint),
  public.rejoin_room(text),
  public.reassign_combo(uuid, smallint, smallint),
  public.start_game(uuid),
  public.lock_question(uuid),
  public.submit_answer(uuid, uuid, real),
  public.reveal_question(uuid),
  public.next_question(uuid),
  public.end_game(uuid),
  public.mark_player_disconnected(uuid),
  public.release_abandoned_combos(text),
  public.migrate_host(uuid, uuid),
  public.cleanup_finished_rooms()
from public, anon;

grant execute on function
  public.server_now(),
  public.create_room(text, jsonb),
  public.join_room(text, text, smallint, smallint),
  public.rejoin_room(text),
  public.reassign_combo(uuid, smallint, smallint),
  public.start_game(uuid),
  public.lock_question(uuid),
  public.submit_answer(uuid, uuid, real),
  public.reveal_question(uuid),
  public.next_question(uuid),
  public.end_game(uuid),
  public.mark_player_disconnected(uuid),
  public.release_abandoned_combos(text),
  public.migrate_host(uuid, uuid)
to authenticated;

-- cleanup_finished_rooms은 authenticated에도 부여하지 않는다(클라이언트 호출 불가).
revoke execute on function public.cleanup_finished_rooms() from authenticated;
