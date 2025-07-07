# 알고리즘 대회 플랫폼 - 프론트엔드

실시간 협업 알고리즘 문제 풀이 플랫폼의 프론트엔드입니다.

## 기술 스택

- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **Socket.IO Client** - 실시간 통신
- **Monaco Editor** - 코드 에디터
- **Zustand** - 상태 관리
- **React Query** - 서버 상태 관리
- **Lucide React** - 아이콘

## 주요 기능

### 🎯 실시간 협업
- 여러 명이 동시에 같은 코드를 편집
- 실시간 코드 동기화
- 사용자 참가/퇴장 알림

### 💬 실시간 채팅
- 방 내에서 실시간 메시지 교환
- 사용자별 메시지 구분
- 실시간 메시지 업데이트

### ⚡ 자동 채점 시스템
- 코드 제출 시 즉시 자동 채점
- 다양한 프로그래밍 언어 지원
- 실시간 채점 결과 표시

### 🏆 대회 관리
- 대회 생성 및 관리
- 문제 관리
- 참가자 관리

## 프로젝트 구조

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── globals.css     # 전역 스타일
│   │   ├── layout.tsx      # 루트 레이아웃
│   │   ├── page.tsx        # 메인 페이지
│   │   ├── login/          # 로그인 페이지
│   │   └── rooms/[id]/     # 방 페이지
│   ├── components/          # 재사용 컴포넌트
│   │   ├── layout/         # 레이아웃 컴포넌트
│   │   └── ui/             # UI 컴포넌트
│   ├── hooks/              # 커스텀 훅
│   ├── lib/                # 유틸리티 및 API
│   ├── store/              # 상태 관리
│   └── types/              # 타입 정의
├── public/                 # 정적 파일
└── package.json
```

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

### 3. 빌드

```bash
npm run build
```

### 4. 프로덕션 실행

```bash
npm start
```

## 환경 설정

### 백엔드 연결

프론트엔드는 기본적으로 `http://localhost:3001`의 백엔드 API에 연결됩니다.

`next.config.js`에서 API 프록시 설정을 확인하세요:

```javascript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:3001/api/:path*',
    },
  ];
},
```

### WebSocket 연결

실시간 기능을 위해 WebSocket은 `http://localhost:3001`에 연결됩니다.

## 주요 페이지

### 1. 메인 페이지 (`/`)
- 플랫폼 소개
- 주요 기능 설명
- 대회 및 방으로의 빠른 이동

### 2. 로그인 페이지 (`/login`)
- 사용자 인증
- 회원가입 링크

### 3. 방 페이지 (`/rooms/[id]`)
- 실시간 코드 편집
- 채팅 기능
- 문제 정보 표시
- 제출 결과 확인

## 컴포넌트 설명

### Navigation
- 상단 네비게이션 바
- 로그인 상태에 따른 메뉴 변경
- 사용자 정보 표시

### MonacoEditor
- 코드 편집을 위한 Monaco Editor
- 실시간 동기화 지원
- 다양한 프로그래밍 언어 지원

### useSocket Hook
- WebSocket 연결 관리
- 실시간 이벤트 처리
- 자동 재연결

## 상태 관리

### Auth Store (Zustand)
- 사용자 인증 상태
- 로그인/로그아웃 기능
- 토큰 관리

### API 클라이언트
- REST API 통신
- 자동 토큰 추가
- 에러 처리

## 실시간 기능

### 코드 동기화
1. 사용자가 코드를 편집
2. WebSocket을 통해 다른 사용자에게 전송
3. 실시간으로 모든 참가자의 코드가 동기화

### 채팅
1. 메시지 입력
2. WebSocket을 통해 방의 모든 사용자에게 전송
3. 실시간으로 메시지 표시

### 제출 결과
1. 코드 제출
2. 백엔드에서 채점
3. WebSocket을 통해 실시간 결과 전송

## 개발 가이드

### 새로운 페이지 추가

1. `src/app/` 디렉토리에 새 폴더 생성
2. `page.tsx` 파일 생성
3. 필요한 컴포넌트 및 훅 import

### 새로운 컴포넌트 추가

1. `src/components/` 디렉토리에 새 파일 생성
2. TypeScript 인터페이스 정의
3. 컴포넌트 구현

### API 호출 추가

1. `src/lib/api.ts`에 새로운 API 함수 추가
2. 타입 정의 확인
3. 컴포넌트에서 사용

## 배포

### Vercel 배포

```bash
npm run build
vercel --prod
```

### Docker 배포

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 문제 해결

### WebSocket 연결 실패
- 백엔드 서버가 실행 중인지 확인
- 포트 3001이 열려있는지 확인
- CORS 설정 확인

### API 호출 실패
- 백엔드 서버 상태 확인
- 네트워크 연결 확인
- API 엔드포인트 확인

### 빌드 오류
- Node.js 버전 확인 (18 이상 권장)
- 의존성 재설치: `npm ci`
- 캐시 클리어: `npm run build -- --no-cache`

## 기여 가이드

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 