FROM golang:1.21-alpine

# Go 컴파일 및 실행에 필요한 최소 패키지만 설치
RUN apk update && apk add --no-cache \
    bash

# 작업 디렉토리 설정
WORKDIR /workspace

# 환경 변수 설정
ENV GO111MODULE=on
ENV GOPROXY=https://proxy.golang.org

# 기본 셸 설정
CMD ["/bin/bash"]