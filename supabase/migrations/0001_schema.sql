-- 모두의 OX: 테이블 정의
-- 참고: C:\Users\G00210\.claude\plans\greedy-inventing-river.md §2

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null check (char_length(title) between 1 and 60),
  host_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'LOBBY'
    check (status in ('LOBBY', 'QUESTION_ACTIVE', 'QUESTION_LOCKED', 'REVEAL', 'FINISHED')),
  current_question_index integer not null default 0,
  question_ends_at timestamptz,
  question_locked_at timestamptz,
  max_players integer not null default 50 check (max_players <= 50),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  last_activity_at timestamptz not null default now()
);

-- 활성 상태(FINISHED가 아닌) 동안에만 code 유일성을 강제한다.
-- 종료된 방이 정리되기 전까지는 같은 코드를 재사용할 수 없지만,
-- 정리 후에는 코드가 자연스럽게 재사용 가능해진다.
create unique index if not exists rooms_code_active_idx
  on public.rooms (code) where status <> 'FINISHED';

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  idx integer not null,
  text text not null check (char_length(text) <= 100),
  created_at timestamptz not null default now(),
  unique (room_id, idx)
);

-- 정답은 별도 테이블로 격리한다(컴럼 단위 RLS가 아님).
-- Postgres RLS는 row-level이라 column 마스킹이 불가능하고,
-- 별도 테이블이 `select *` 실수로도 새어나갈 위험이 구조적으로 없어 더 안전하다.
create table if not exists public.question_secrets (
  question_id uuid primary key references public.questions(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  correct_answer text check (correct_answer in ('O', 'X')),
  revealed boolean not null default false,
  revealed_at timestamptz
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 8),
  -- 콤보 해제(재접속 유예 60초 경과) 시 character_id/color_id를 null로
  -- 되돌려 슬롯을 반환하므로 nullable이다.
  character_id smallint check (character_id between 1 and 12),
  color_id smallint check (color_id between 1 and 6),
  is_spectator_for_question_idx integer,
  score integer not null default 0,
  disconnected_at timestamptz,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  unique (room_id, user_id),
  unique (room_id, nickname)
);

-- 72콤보 충돌 방어의 실제 근거: 두 join_room 호출이 동시에 같은 조합을
-- 시도하면 하나만 성공하고 나머지는 23505 unique_violation을 받는다.
-- character_id/color_id가 둘 다 null이 아닐 때만(실제 활성 플레이어만) 적용.
create unique index if not exists players_combo_unique_idx
  on public.players (room_id, character_id, color_id)
  where character_id is not null and color_id is not null;

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  -- null = 미제출(무응답). reveal_question이 미제출자용 행을 보정 insert할 때 사용.
  x_position real check (x_position is null or (x_position >= 0 and x_position <= 1)),
  judged_answer text check (judged_answer in ('O', 'X')),
  is_correct boolean,
  submitted_at timestamptz not null default now(),

  unique (question_id, player_id)
);

create index if not exists questions_room_id_idx on public.questions (room_id);
create index if not exists players_room_id_idx on public.players (room_id);
create index if not exists answers_room_id_idx on public.answers (room_id);
create index if not exists answers_question_id_idx on public.answers (question_id);

-- Postgres Changes(Realtime)로 UPDATE/INSERT 이벤트를 받으려면 테이블이
-- supabase_realtime publication에 포함되어 있어야 한다(기본적으로 새 테이블은
-- 빠져 있음). rooms는 상태 머신 전이 전파에, players는 목록/점수 갱신에 쓰인다.
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.players;
