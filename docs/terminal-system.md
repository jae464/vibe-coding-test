# 터미널 시스템

## 개요

사용자별 독립된 터미널 환경을 제공하는 시스템입니다. Docker 컨테이너를 사용하여 각 사용자에게 격리된 실행 환경을 제공합니다.

## 주요 기능

### 1. 독립된 터미널 세션

- 각 사용자별로 독립된 Docker 컨테이너 생성
- 다양한 프로그래밍 언어 지원 (Bash, JavaScript, Python, Java, C++)
- 메모리 및 CPU 사용량 제한으로 안전성 보장

### 2. 실시간 명령어 실행

- WebSocket을 통한 실시간 통신
- 명령어 실행 결과 즉시 반환
- 에러 처리 및 종료 코드 확인

### 3. 파일 관리

- 컨테이너 내부 파일 생성/수정
- 파일 내용 읽기
- 작업 디렉토리 관리

### 4. 세션 관리

- 세션 생성/종료
- 사용자별 세션 목록 조회
- 비활성 세션 자동 정리 (30분)

## 기술 스택

### 백엔드

- **NestJS**: 프레임워크
- **Docker**: 컨테이너 격리
- **dockerode**: Docker API 클라이언트
- **Socket.io**: 실시간 통신
- **JWT**: 인증

### 프론트엔드

- **Next.js**: React 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링
- **Socket.io Client**: 실시간 통신

## API 엔드포인트

### REST API

#### 세션 관리

- `POST /terminal/sessions` - 새 세션 생성
- `GET /terminal/sessions` - 사용자 세션 목록 조회
- `GET /terminal/sessions/:sessionId` - 세션 정보 조회
- `DELETE /terminal/sessions/:sessionId` - 세션 종료
- `DELETE /terminal/sessions` - 사용자 모든 세션 종료

#### 명령어 실행

- `POST /terminal/sessions/:sessionId/execute` - 명령어 실행

#### 파일 관리

- `POST /terminal/sessions/:sessionId/files` - 파일 생성
- `GET /terminal/sessions/:sessionId/files/:filename` - 파일 읽기

#### 시스템 정보

- `GET /terminal/system/info` - 시스템 정보 조회

### WebSocket 이벤트

#### 클라이언트 → 서버

- `create_session` - 새 세션 생성
- `execute_command` - 명령어 실행
- `create_file` - 파일 생성
- `read_file` - 파일 읽기
- `destroy_session` - 세션 종료
- `list_sessions` - 세션 목록 조회
- `system_info` - 시스템 정보 조회

#### 서버 → 클라이언트

- `session_created` - 세션 생성 완료
- `command_result` - 명령어 실행 결과
- `file_created` - 파일 생성 완료
- `file_content` - 파일 내용
- `session_destroyed` - 세션 종료 완료
- `sessions_list` - 세션 목록
- `system_info` - 시스템 정보
- `error` - 에러 메시지

## 보안 기능

### 1. 컨테이너 격리

- 각 사용자별 독립된 컨테이너
- 리소스 사용량 제한 (메모리 512MB, CPU 50%)
- 권한 제한 (`no-new-privileges`)

### 2. 인증 및 권한

- JWT 토큰 기반 인증
- 사용자별 세션 관리
- 세션 소유권 검증

### 3. 리소스 제한

- 메모리 사용량 제한
- CPU 사용량 제한
- 컨테이너 수명 주기 관리

## 사용 방법

### 1. 세션 생성

```typescript
// REST API
const response = await fetch("/api/terminal/sessions", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ language: "python" }),
});

// WebSocket
socket.emit("create_session", { language: "python" });
```

### 2. 명령어 실행

```typescript
// REST API
const response = await fetch(`/api/terminal/sessions/${sessionId}/execute`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({ command: "ls -la" }),
});

// WebSocket
socket.emit("execute_command", {
  sessionId: sessionId,
  command: "ls -la",
});
```

### 3. 파일 생성

```typescript
// REST API
const response = await fetch(`/api/terminal/sessions/${sessionId}/files`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    filename: "test.py",
    content: 'print("Hello, World!")',
  }),
});

// WebSocket
socket.emit("create_file", {
  sessionId: sessionId,
  filename: "test.py",
  content: 'print("Hello, World!")',
});
```

## 지원 언어

| 언어       | Docker 이미지      | 설명             |
| ---------- | ------------------ | ---------------- |
| Bash       | ubuntu:latest      | 기본 쉘 환경     |
| JavaScript | node:18-alpine     | Node.js 환경     |
| Python     | python:3.11-alpine | Python 3.11 환경 |
| Java       | openjdk:17-alpine  | Java 17 환경     |
| C++        | gcc:latest         | GCC 컴파일러     |

## 모니터링 및 관리

### 1. 세션 모니터링

- 활성 세션 수 추적
- 사용자별 세션 관리
- 세션 활동 시간 기록

### 2. 리소스 모니터링

- 컨테이너별 리소스 사용량
- 시스템 전체 리소스 상태
- 메모리 및 CPU 사용량 추적

### 3. 자동 정리

- 30분 이상 비활성 세션 자동 종료
- 컨테이너 리소스 정리
- 로그 정리

## 배포 요구사항

### 1. Docker 설정

- Docker 소켓 마운트 필요
- Docker CLI 설치
- 컨테이너 실행 권한

### 2. 시스템 요구사항

- 최소 2GB RAM
- 최소 2 CPU 코어
- Docker Engine 설치

### 3. 네트워크 설정

- WebSocket 연결 허용
- Docker 네트워크 설정
- 방화벽 설정

## 문제 해결

### 1. 세션 생성 실패

- Docker 서비스 상태 확인
- 권한 설정 확인
- 리소스 사용량 확인

### 2. 명령어 실행 실패

- 컨테이너 상태 확인
- 네트워크 연결 확인
- 로그 확인

### 3. 성능 문제

- 리소스 사용량 모니터링
- 컨테이너 수 제한
- 캐시 설정 최적화

## 향후 개선 사항

### 1. 기능 확장

- 더 많은 프로그래밍 언어 지원
- IDE 통합
- 코드 실행 결과 저장

### 2. 성능 최적화

- 컨테이너 풀링
- 캐시 시스템
- 로드 밸런싱

### 3. 보안 강화

- 네트워크 격리
- 파일 시스템 제한
- 실행 명령어 제한
