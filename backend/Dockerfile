# Node.js 18 Alpine 이미지 사용
FROM node:18-alpine

# Docker CLI 설치
RUN apk add --no-cache docker-cli

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# TypeORM CLI 설치
# RUN npm install -g @nestjs/cli

# 빌드
RUN npm run build

# 빌드 결과 확인
RUN ls -la dist/

# 포트 노출
# EXPOSE 3001

# 애플리케이션 실행
CMD ["npm", "run", "start"] 