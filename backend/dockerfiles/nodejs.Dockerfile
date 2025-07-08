FROM node:18-slim

# 시스템 업데이트 및 필요한 패키지 설치
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /workspace

# JavaScript 실행에 필요한 최소 패키지만 설치
# (Node.js 런타임은 기본 이미지에 포함됨)

# 환경 변수 설정
ENV NODE_ENV=development

# 기본 셸 설정
CMD ["/bin/bash"]