FROM node:18-slim

# 시스템 업데이트 및 필요한 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    wget \
    curl \
    git \
    vim \
    nano \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /workspace

# 전역 npm 패키지 설치
RUN npm install -g \
    typescript \
    ts-node \
    nodemon \
    express \
    @types/node \
    @types/express

# 환경 변수 설정
ENV NODE_ENV=development

# 기본 셸 설정
CMD ["/bin/bash"]