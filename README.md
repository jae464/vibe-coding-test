# Algorithm Contest Backend

알고리즘 대회 서비스의 백엔드 API입니다. 여러 명이 함께 참여하여 실시간으로 문제를 풀 수 있는 플랫폼입니다.

## 기술 스택

- **Framework**: NestJS
- **Database**: PostgreSQL
- **ORM**: TypeORM
- **Real-time**: Socket.IO
- **Language**: TypeScript

## 주요 기능

- 실시간 동시 코드 편집
- 알고리즘 문제 채점
- 실시간 채팅
- 대회/방 관리
- 유저 관리

## 데이터베이스 스키마

### 주요 엔터티

- **User**: 사용자 정보
- **Contest**: 대회 정보
- **Room**: 문제 풀이 방
- **Problem**: 알고리즘 문제
- **Submission**: 코드 제출
- **Testcase**: 테스트케이스
- **ChatMessage**: 채팅 메시지

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=algorithm_contest

# JWT
JWT_SECRET=your-secret-key

# Server
PORT=3001
NODE_ENV=development
```

### 3. 데이터베이스 설정

PostgreSQL을 설치하고 데이터베이스를 생성하세요:

```sql
CREATE DATABASE algorithm_contest;
```

### 4. 애플리케이션 실행

```bash
# 개발 모드
npm run start:dev

# 프로덕션 모드
npm run start:prod
```

## API 문서

서버 실행 후 `http://localhost:3001/api`에서 API 문서를 확인할 수 있습니다.

## 프로젝트 구조

```
src/
├── entities/          # TypeORM 엔터티
├── modules/           # 기능별 모듈
├── config/            # 설정 파일
├── utils/             # 유틸리티 함수
└── main.ts           # 애플리케이션 진입점
```

## 개발 가이드

### 새로운 엔터티 추가

1. `src/entities/` 디렉토리에 새 엔터티 파일 생성
2. `src/entities/index.ts`에 export 추가
3. `src/config/database.config.ts`에 엔터티 추가

### 새로운 API 추가

1. `src/modules/` 디렉토리에 새 모듈 생성
2. Controller, Service, DTO 클래스 작성
3. `src/app.module.ts`에 모듈 등록

## 라이센스

MIT 