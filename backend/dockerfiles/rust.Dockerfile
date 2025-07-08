FROM rust:1.70-slim

# Rust 컴파일 및 실행에 필요한 최소 패키지만 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /workspace

# 환경 변수 설정
ENV RUST_BACKTRACE=1
ENV CARGO_HOME=/usr/local/cargo
ENV PATH=$CARGO_HOME/bin:$PATH

# 기본 셸 설정
CMD ["/bin/bash"]