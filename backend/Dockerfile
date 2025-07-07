# Node.js 18 Alpine 이미지 사용
FROM node:18-alpine

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm ci --only=production && npm cache clean --force
# RUN npm install

# 소스 코드 복사
COPY . .

# TypeORM CLI 설치
RUN npm install -g @nestjs/cli

# 빌드
RUN npm run build

# 포트 노출
EXPOSE 3001

# 헬스체크 추가
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD curl -f http://localhost:3001/health || exit 1

# 애플리케이션 실행
CMD ["npm", "run", "start:prod"] 