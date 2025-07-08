FROM openjdk:17-slim

# Java 컴파일 및 실행에 필요한 최소 패키지만 설치
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /workspace

# 환경 변수 설정
ENV JAVA_HOME=/usr/local/openjdk-17
ENV PATH=$JAVA_HOME/bin:$PATH

# 기본 셸 설정
CMD ["/bin/bash"]