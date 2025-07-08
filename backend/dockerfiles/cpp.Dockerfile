FROM gcc:11

# 시스템 업데이트 및 필요한 패키지 설치
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    gdb \
    valgrind \
    wget \
    curl \
    git \
    vim \
    nano \
    clang \
    lldb \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /workspace

# 환경 변수 설정
ENV CC=gcc
ENV CXX=g++

# 기본 셸 설정
CMD ["/bin/bash"]