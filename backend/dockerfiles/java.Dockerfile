FROM openjdk:17-slim

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
    maven \
    gradle \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /workspace

# 환경 변수 설정
ENV JAVA_HOME=/usr/local/openjdk-17
ENV PATH=$JAVA_HOME/bin:$PATH

# 기본 셸 설정
CMD ["/bin/bash"]