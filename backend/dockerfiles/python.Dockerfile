FROM python:3.11-slim

# 시스템 업데이트 및 필요한 패키지 설치
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# 작업 디렉토리 설정
WORKDIR /workspace

# Python 패키지 설치 (코드 실행에 필수)
RUN pip install --no-cache-dir \
    numpy

# 환경 변수 설정
ENV PYTHONPATH=/workspace
ENV PYTHONUNBUFFERED=1

# 기본 셸 설정
CMD ["/bin/bash"]