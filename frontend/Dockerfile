# Node.js 18 Alpine 이미지 사용
FROM node:18-alpine AS base

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production && npm cache clean --force

# 소스 코드 복사
COPY . .

# 개발 의존성 설치 (빌드용)
RUN npm ci

# 빌드
RUN npm run build

# 프로덕션 이미지
FROM node:18-alpine AS production

WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 프로덕션 의존성만 설치
RUN npm ci --only=production && npm cache clean --force

# 빌드된 파일 복사
COPY --from=base /app/.next ./.next
# COPY --from=base /app/public ./public

# 포트 노출
EXPOSE 3002

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002 || exit 1

# 애플리케이션 실행
CMD ["npm", "start"] 