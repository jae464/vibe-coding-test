FROM golang:1.21-alpine

# 시스템 업데이트 및 필요한 패키지 설치
RUN apk update && apk add --no-cache \
    gcc \
    g++ \
    make \
    wget \
    curl \
    git \
    vim \
    nano \
    bash \
    musl-dev

# 작업 디렉토리 설정
WORKDIR /workspace

# 환경 변수 설정
ENV GO111MODULE=on
ENV GOPROXY=https://proxy.golang.org

# 기본 셸 설정
CMD ["/bin/bash"]