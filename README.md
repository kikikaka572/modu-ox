# 모두의 OX

실시간 멀티플레이어 OX 퀴즈 파티 게임. 별도 서버 없이 Supabase(Free plan)만으로 동작하며, 사내망 제약 때문에 호스트 PC에서 직접 구동해 같은 네트워크의 참여자가 접속하는 구조입니다.

## 1. 기술 스택

- Vite + React 19 + TypeScript + Tailwind CSS v4
- Zustand(실시간 상태) + TanStack Query(일회성 조회)
- React Router v6
- Supabase(`@supabase/supabase-js`) — REST + Realtime(Broadcast/Presence/Postgres Changes) + Anonymous Auth
- Framer Motion, qrcode.react

## 2. 로컬 실행

```bash
npm install
npm run dev -- --host
```

`http://localhost:5173/diag` 에서 REST/Realtime/Broadcast 연결성을 먼저 확인하세요.

## 3. Supabase 설정

1. supabase.com에서 새 프로젝트 생성 (Free plan)
2. Authentication → Providers → Anonymous Sign-ins 활성화
3. SQL Editor에서 `supabase/migrations/`의 4개 파일을 순서대로 실행
4. Settings → API에서 URL/anon key 복사 → `.env` 생성

## 4. 사내 접속 가이드

`npm run dev -- --host`로 구동하면 콘솔에 LAN IP가 출력됩니다. 홈 화면 QR코드로 참여자가 접속합니다. 외부 호스팅(Vercel 등)은 사용하지 않습니다.

## 5. 실시간 채널 설계

채널명 `room:{6자리코드}` 하나를 Broadcast(좌표)/Presence(접속자)/Postgres Changes(상태전이)로 분리 사용.

## 6. 캐릭터 구성

12종 × 색상 6종 = 72콤보를 12개 SVG 컴포넌트 + 6행 팔레트 테이블로 구성(72개 파일이 아님).

## 7. 테스트 체크리스트

`/diag` 통과 후 방 생성→캐릭터 선택→로비→게임→결과까지 실제 멀티 클라이언트로 확인하세요.
