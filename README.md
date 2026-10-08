# 모두의 OX (Modu OX)

실시간 멀티플레이어 웹 기반 OX 퀴즈 게임입니다.

## 기술 스택

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database & Realtime**: Supabase
- **State Management**: TanStack Query + React Context
- **Routing**: React Router v6

## 주요 기능

- 실시간 멀티플레이어 게임 (WebSocket 기반)
- 게임 방 생성 및 참여
- 실시간 점수 동기화
- 호스트 게임 관리

## 설치 및 실행

### 사전 요구사항
- Node.js 18+ 
- npm

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env.local` 파일을 생성하고 Supabase 정보를 입력하세요:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 에 접속하면 됩니다.

### 4. 프로덕션 빌드
```bash
npm run build
```

## 프로젝트 구조

```
src/
├── pages/           # 페이지 컴포넌트 (Home, CreateGame, JoinGame, Game)
├── components/      # 재사용 가능한 UI 컴포넌트
├── hooks/          # 커스텀 React 훅 (useGameRoom)
├── lib/            # 유틸리티 및 Supabase 클라이언트
├── types/          # TypeScript 타입 정의
├── App.tsx         # 라우팅 설정
├── main.tsx        # 엔트리 포인트
└── index.css       # 글로벌 스타일
```

## 개발 규칙

- `@/*` 경로 별칭을 사용하여 import
- TypeScript strict mode 사용
- Tailwind CSS 유틸리티 클래스 우선
- 실시간 동기화는 `useGameRoom` 훅 사용

## 라이선스

MIT
