-- 모두의 OX: Row Level Security
-- 참고: C:\Users\G00210\.claude\plans\greedy-inventing-river.md §4
--
-- 공통 원칙: INSERT/UPDATE/DELETE 정책을 의도적으로 만들지 않는다.
-- RLS가 켜진 테이블에서 해당 작업에 매칭되는 정책이 없으면 기본적으로
-- 거부되므로, 모든 쓰기는 security definer RPC(0003_rpcs.sql)를 통해서만
-- 가능해진다. RPC는 함수 소유자 권한으로 실행되어 RLS를 우회한다.

alter table public.rooms enable row level security;
alter table public.questions enable row level security;
alter table public.question_secrets enable row level security;
alter table public.players enable row level security;
alter table public.answers enable row level security;

-- players 테이블의 "같은 room 멤버인가" 체크는 players 자신을 다시 조회해야
-- 하므로, 일반 서브쿼리로 쓰면 그 조회가 players_select 정책을 다시 평가하고,
-- 그 평가가 또 players를 조회하는 무한 재귀(42P17)에 빠진다. security definer
-- 함수는 내부 쿼리가 RLS를 우회하므로(테이블 소유자 권한으로 실행) 이 순환을
-- 끓어준다 — players처럼 "자기 자신을 참조해야 하는" 정책에서만 필요하다.
create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from players where room_id = p_room_id and user_id = auth.uid()
  );
$$;

-- ── rooms ──────────────────────────────────────────────────────────────────────
-- host 본인 또는 해당 room에 참가한 player만 조회 가능.
-- 코드로 방을 "찾는" 행위는 join_room RPC(security definer) 내부에서
-- 수행되므로, 아직 참가하지 않은 사용자가 room을 직접 SELECT할 필요가 없다.
create policy rooms_select on public.rooms
  for select to authenticated
  using (
    host_id = auth.uid()
    or exists (
      select 1 from public.players p
      where p.room_id = rooms.id and p.user_id = auth.uid()
    )
  );

-- ── questions ───────────────────────────────────────────────────────────────
-- 정답이 없는 테이블이므로 room 구성원에게 전체 노출해도 안전하다.
create policy questions_select on public.questions
  for select to authenticated
  using (
    exists (
      select 1 from public.players p
      where p.room_id = questions.room_id and p.user_id = auth.uid()
    )
    or exists (
      select 1 from public.rooms r
      where r.id = questions.room_id and r.host_id = auth.uid()
    )
  );

-- ── question_secrets ────────────────────────────────────────────────────
-- 기본적으로 anon/authenticated에 어떤 권한도 주지 않는다. reveal_question
-- RPC가 revealed=true로 바꿔 행만, 아래 정책을 통해 열람 가능해진다.
-- 이것이 "reveal 전까지 절대 열람 불가" 요구를 만족시키는 유일한 예외다.
revoke all on public.question_secrets from anon, authenticated;
grant select on public.question_secrets to authenticated;

create policy question_secrets_select_after_reveal on public.question_secrets
  for select to authenticated
  using (
    revealed = true
    and exists (
      select 1 from public.players p
      where p.room_id = question_secrets.room_id and p.user_id = auth.uid()
    )
  );

-- ── players ─────────────────────────────────────────────────────────────────
-- 같은 room 구성원 전체가 서로를 볼 수 있어야 로비/순위 표시가 가능하다.
-- is_room_member()를 쓰는 이유는 위 주석 참고(자기 참조 재귀 방지).
create policy players_select on public.players
  for select to authenticated
  using (is_room_member(room_id));

-- ── answers ─────────────────────────────────────────────────────────────────
-- reveal 전: 본인 답만. reveal 후(question_secrets.revealed=true): room 전체 공개.
-- 호스트는 항상 전체 열람 가능(결과 집계용).
create policy answers_select on public.answers
  for select to authenticated
  using (
    exists (
      select 1 from public.players p
      where p.id = answers.player_id and p.user_id = auth.uid()
    )
    or exists (
      select 1 from public.question_secrets qs
      join public.players p2 on p2.room_id = answers.room_id and p2.user_id = auth.uid()
      where qs.question_id = answers.question_id and qs.revealed = true
    )
    or exists (
      select 1 from public.rooms r
      where r.id = answers.room_id and r.host_id = auth.uid()
    )
  );
