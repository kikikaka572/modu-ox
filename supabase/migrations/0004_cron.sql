-- 모두의 OX: 정리(cleanup) 스케줄링
-- 참고: C:\Users\G00210\.claude\plans\greedy-inventing-river.md §5, §8
--
-- pg_cron은 Supabase Free plan에서도 DB 확장(extension)으로 사용 가능하다.
-- (Edge Function용 대시보드 Cron 트리거와는 별개 기능이다.)
-- 활성화가 안 되는 프로젝트라면 아래 cron.schedule 블록은 실패하므로,
-- 그 경우 파일 하단의 "수동 실행" 안내를 따른다.

create extension if not exists pg_cron;

-- 매시 정각에 종료된 지 24시간 지난 방, 혹은 24시간 동안 활동이 없는
-- 비정상 종료 방을 정리한다. cleanup_finished_rooms()는 security definer이며
-- pg_cron은 스케줄을 등록한 역할(superuser 계열)으로 실행되므로 권한 문제가 없다.
select cron.schedule(
  'modu-ox-cleanup-finished-rooms',
  '0 * * * *',
  $$select public.cleanup_finished_rooms();$$
);

-- ── pg_cron을 쓸 수 없는 경우의 수동 실행 안내 ─────────────────
-- Supabase 대시보드 → SQL Editor에서 직접 실행:
--   select public.cleanup_finished_rooms();
-- 또는 외부 스케줄러(예: GitHub Actions 정기 워크플로)가 서비스 롤 키로
-- 위 RPC를 호출하도록 구성한다. 이 함수는 클라이언트(anon/authenticated)
-- 에는 EXECUTE 권한이 없으므로(0003_rpcs.sql 참고), service_role 키 또는
-- SQL Editor(= superuser 권한)로만 호출 가능하다.
--
-- 프로젝트가 일정 기간(약 1주) API 요청이 없으면 Free plan은 자동 일시정지
-- 되며, 이 경우 pg_cron 작업도 함께 멈추다. 별도 조치는 필요 없다 —
-- 정리 기준이 "경과 시간"이므로 프로젝트가 재개되면 다음 스케줄에서
-- 자연스럽게 밀린 정리를 수행한다.
