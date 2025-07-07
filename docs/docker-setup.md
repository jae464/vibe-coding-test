# Docker Compose 설정 가이드

이 문서는 Docker Compose를 사용하여 알고리즘 대회 플랫폼의 모든 서비스를 한 번에 실행하는 방법을 설명합니다.

## 🐳 포함된 서비스

### 1. PostgreSQL (데이터베이스)
- **포트**: 5432
- **데이터베이스**: algorithm_contest
- **사용자**: postgres
- **비밀번호**: password
- **볼륨**: postgres_data

### 2. Redis (캐시)
- **포트**: 6379
- **볼륨**: redis_data

### 3. Backend (NestJS API 서버)
- **포트**: 3001
- **환경**: 개발 모드
- **의존성**: PostgreSQL, Redis

### 4. Judge Service (채점 서비스)
- **포트**: 3002
- **기능**: 코드 실행 및 채점

### 5. Frontend (Next.js 웹 애플리케이션)
- **포트**: 3000
- **의존성**: Backend

## 🚀 빠른 시작

### 1. 사전 요구사항

- Docker 설치: https://docs.docker.com/get-docker/
- Docker Compose 설치: https://docs.docker.com/compose/install/

### 2. 서비스 시작

```bash
# 모든 서비스 시작
./scripts/docker-setup.sh start

# 또는 직접 실행
docker-compose up -d
```

### 3. 서비스 상태 확인

```bash
# 서비스 상태 확인
./scripts/docker-setup.sh status

# 또는 직접 확인
docker-compose ps
```

### 4. 로그 확인

```bash
# 모든 서비스 로그 확인
./scripts/docker-setup.sh logs

# 특정 서비스 로그 확인
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

## 📋 스크립트 명령어

### 서비스 관리

```bash
# 서비스 시작
./scripts/docker-setup.sh start

# 서비스 중지
./scripts/docker-setup.sh stop

# 서비스 재시작
./scripts/docker-setup.sh restart

# 서비스 상태 확인
./scripts/docker-setup.sh status

# 로그 확인
./scripts/docker-setup.sh logs

# 데이터베이스 마이그레이션
./scripts/docker-setup.sh migrate

# 모든 컨테이너 및 볼륨 정리
./scripts/docker-setup.sh clean
```

## 🔧 수동 설정

### 1. 환경 변수 설정

```bash
# 백엔드 환경 변수 복사
cp backend/env.example backend/.env

# 환경 변수 편집
nano backend/.env
```

### 2. Docker Compose 실행

```bash
# 개발 모드로 실행
docker-compose up -d

# 로그와 함께 실행
docker-compose up

# 특정 서비스만 실행
docker-compose up -d postgres redis backend
```

### 3. 데이터베이스 마이그레이션

```bash
# 마이그레이션 실행
docker-compose exec backend npm run migration:run

# 마이그레이션 되돌리기
docker-compose exec backend npm run migration:revert
```

## 🌐 접속 정보

### 웹 애플리케이션
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:3001
- **API 문서**: http://localhost:3001/api

### 데이터베이스
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 채점 서비스
- **Judge Service**: http://localhost:3002

## 🔍 문제 해결

### 1. 포트 충돌

```bash
# 사용 중인 포트 확인
lsof -i :3000
lsof -i :3001
lsof -i :5432
lsof -i :6379

# 충돌하는 프로세스 종료
kill -9 <PID>
```

### 2. 컨테이너 로그 확인

```bash
# 특정 컨테이너 로그
docker-compose logs backend
docker-compose logs postgres
docker-compose logs redis

# 실시간 로그 확인
docker-compose logs -f backend
```

### 3. 데이터베이스 연결 문제

```bash
# PostgreSQL 컨테이너 접속
docker-compose exec postgres psql -U postgres -d algorithm_contest

# Redis 컨테이너 접속
docker-compose exec redis redis-cli
```

### 4. 볼륨 정리

```bash
# 모든 볼륨 삭제
docker-compose down -v

# Docker 시스템 정리
docker system prune -f
```

## 📊 모니터링

### 1. 리소스 사용량 확인

```bash
# 컨테이너 리소스 사용량
docker stats

# 특정 컨테이너 정보
docker-compose ps
```

### 2. 헬스체크

```bash
# 백엔드 헬스체크
curl http://localhost:3001/health

# 프론트엔드 헬스체크
curl http://localhost:3000
```

## 🔒 보안 설정

### 1. 프로덕션 환경

```bash
# 환경 변수 변경
# backend/.env 파일에서 다음 값들을 변경:
JWT_SECRET=your-production-secret-key
DB_PASSWORD=your-production-password
```

### 2. 네트워크 보안

```bash
# 외부 접근 제한 (선택사항)
# docker-compose.yml에서 ports 섹션을 주석 처리
```

## 📝 개발 팁

### 1. 코드 변경 시 자동 재시작

```bash
# 볼륨 마운트로 개발 모드 실행
docker-compose up -d
```

### 2. 데이터베이스 백업

```bash
# PostgreSQL 백업
docker-compose exec postgres pg_dump -U postgres algorithm_contest > backup.sql

# Redis 백업
docker-compose exec redis redis-cli BGSAVE
```

### 3. 로컬 개발 환경

```bash
# 백엔드만 로컬에서 실행
docker-compose up -d postgres redis
npm run start:dev

# 프론트엔드만 로컬에서 실행
docker-compose up -d postgres redis backend
cd frontend && npm run dev
```

## 🚀 배포

### 1. 프로덕션 빌드

```bash
# 프로덕션 이미지 빌드
docker-compose -f docker-compose.prod.yml up -d
```

### 2. 스케일링

```bash
# 백엔드 서비스 스케일링
docker-compose up -d --scale backend=3
```

## 📚 추가 리소스

- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [NestJS Docker 가이드](https://docs.nestjs.com/deployment/docker)
- [Next.js Docker 가이드](https://nextjs.org/docs/deployment#docker-image) 