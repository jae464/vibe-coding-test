# 알고리즘 대회 플랫폼

실시간 협업 알고리즘 문제 풀이 플랫폼입니다. 여러 명이 함께 문제를 풀고, 실시간으로 코드를 공유하며, 서로의 아이디어를 나눌 수 있습니다.

## 🚀 주요 기능

### 🎯 실시간 협업
- **동시 코드 편집**: 여러 명이 동시에 같은 코드를 편집
- **실시간 동기화**: 코드 변경사항이 실시간으로 모든 참가자에게 전송
- **사용자 관리**: 참가자 참가/퇴장 실시간 알림

### 💬 실시간 채팅
- **방 내 채팅**: 팀원들과 실시간 메시지 교환
- **사용자 구분**: 각 사용자별 메시지 표시
- **실시간 업데이트**: 메시지가 즉시 모든 참가자에게 전송

### ⚡ 자동 채점 시스템
- **즉시 채점**: 코드 제출 시 자동으로 채점 실행
- **다양한 언어**: JavaScript, Python, Java, C++ 지원
- **실시간 결과**: 채점 결과를 실시간으로 표시

### 🏆 대회 관리
- **대회 생성**: 관리자가 대회를 생성하고 관리
- **문제 관리**: 다양한 난이도의 문제 등록
- **참가자 관리**: 대회별 참가자 관리

## 🛠 기술 스택

### 백엔드
- **NestJS** - Node.js 프레임워크
- **TypeORM** - 데이터베이스 ORM
- **PostgreSQL** - 메인 데이터베이스
- **Socket.IO** - 실시간 통신
- **Docker** - 채점 환경 격리
- **JWT** - 인증 시스템

### 프론트엔드
- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **Monaco Editor** - 코드 에디터
- **Zustand** - 상태 관리
- **Socket.IO Client** - 실시간 통신

## 📁 프로젝트 구조

```
algorithm/
├── backend/                 # NestJS 백엔드
│   ├── src/
│   │   ├── modules/        # 기능별 모듈
│   │   │   ├── auth/       # 인증 모듈
│   │   │   ├── users/      # 사용자 모듈
│   │   │   ├── contests/   # 대회 모듈
│   │   │   ├── problems/   # 문제 모듈
│   │   │   ├── rooms/      # 방 모듈
│   │   │   ├── submissions/# 제출 모듈
│   │   │   └── judge/      # 채점 모듈
│   │   ├── entities/       # 데이터베이스 엔티티
│   │   └── app.module.ts   # 루트 모듈
│   ├── docker-judge/       # Docker 채점 환경
│   └── docs/               # 문서
├── frontend/               # Next.js 프론트엔드
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   ├── components/    # React 컴포넌트
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── lib/           # 유틸리티 및 API
│   │   ├── store/         # 상태 관리
│   │   └── types/         # TypeScript 타입
│   └── README.md          # 프론트엔드 문서
└── README.md              # 이 파일
```

## 🚀 빠른 시작

### 1. 백엔드 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 데이터베이스 설정

# 데이터베이스 마이그레이션
npm run migration:run

# 개발 서버 실행
npm run start:dev
```

### 2. 프론트엔드 설정

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 3. Docker 채점 환경 설정

```bash
# Docker 이미지 빌드
cd backend/docker-judge
docker build -t algorithm-judge .

# 채점 서비스 실행
docker run -d --name judge-service algorithm-judge
```

## 📖 API 문서

### 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 대회 API
- `GET /api/contests` - 대회 목록 조회
- `POST /api/contests` - 대회 생성
- `GET /api/contests/:id` - 대회 상세 조회

### 문제 API
- `GET /api/problems` - 문제 목록 조회
- `POST /api/problems` - 문제 생성
- `GET /api/problems/:id` - 문제 상세 조회

### 방 API
- `GET /api/rooms` - 방 목록 조회
- `POST /api/rooms` - 방 생성
- `POST /api/rooms/:id/join` - 방 참가
- `POST /api/rooms/:id/leave` - 방 퇴장

### 제출 API
- `POST /api/submissions` - 코드 제출
- `GET /api/submissions` - 제출 목록 조회
- `GET /api/submissions/:id` - 제출 상세 조회

## 🔌 WebSocket 이벤트

### 클라이언트 → 서버
- `join-room` - 방 참가
- `leave-room` - 방 퇴장
- `code-change` - 코드 변경
- `send-message` - 채팅 메시지 전송

### 서버 → 클라이언트
- `user-joined` - 사용자 참가 알림
- `user-left` - 사용자 퇴장 알림
- `code-sync` - 코드 동기화
- `chat-message` - 채팅 메시지 수신
- `submission-result` - 제출 결과

## 🗄 데이터베이스 스키마

### 주요 엔티티
- **User** - 사용자 정보
- **Contest** - 대회 정보
- **Problem** - 문제 정보
- **Room** - 방 정보
- **RoomUser** - 방 참가자
- **Submission** - 코드 제출
- **Testcase** - 테스트케이스
- **ChatMessage** - 채팅 메시지

## 🔒 보안

### 인증
- JWT 토큰 기반 인증
- 토큰 만료 시간 설정
- 자동 토큰 갱신

### 채점 환경
- Docker 컨테이너 격리
- 리소스 제한 설정
- 안전한 코드 실행

### 입력 검증
- 모든 API 엔드포인트 입력 검증
- SQL 인젝션 방지
- XSS 공격 방지

## 🚀 배포

### 백엔드 배포

```bash
# 프로덕션 빌드
npm run build

# PM2로 실행
pm2 start dist/main.js --name algorithm-backend
```

### 프론트엔드 배포

```bash
# Vercel 배포
npm run build
vercel --prod

# 또는 Docker 배포
docker build -t algorithm-frontend .
docker run -p 3000:3000 algorithm-frontend
```

## 🧪 테스트

### 백엔드 테스트

```bash
# 단위 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```

### 프론트엔드 테스트

```bash
# 테스트 실행
npm test

# 테스트 커버리지
npm run test:coverage
```

## 📝 개발 가이드

### 코드 스타일
- ESLint 및 Prettier 사용
- TypeScript 엄격 모드
- 일관된 네이밍 컨벤션

### 커밋 메시지
- Conventional Commits 사용
- 명확한 변경사항 설명

### 브랜치 전략
- `main` - 프로덕션 브랜치
- `develop` - 개발 브랜치
- `feature/*` - 기능 브랜치
- `hotfix/*` - 긴급 수정 브랜치

## 🤝 기여하기

1. 이 저장소를 Fork합니다
2. 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해 주세요.

## 🙏 감사의 말

이 프로젝트는 다음과 같은 오픈소스 프로젝트들을 사용합니다:

- [NestJS](https://nestjs.com/)
- [Next.js](https://nextjs.org/)
- [Socket.IO](https://socket.io/)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Tailwind CSS](https://tailwindcss.com/) 