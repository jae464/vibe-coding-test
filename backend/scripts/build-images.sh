#!/bin/bash

# Docker 이미지 빌드 스크립트
# 언어별 Docker 이미지를 미리 빌드합니다.

echo "🚀 Starting Docker image build process..."

# 기본 디렉토리 설정
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKERFILE_DIR="${BASE_DIR}/dockerfiles"

# 언어별 이미지 빌드
languages=("python" "nodejs" "java" "cpp" "go" "rust")

for lang in "${languages[@]}"; do
    echo "📦 Building Docker image for ${lang}..."
    
    dockerfile_path="${DOCKERFILE_DIR}/${lang}.Dockerfile"
    image_name="vibe-coding-${lang}"
    
    if [ ! -f "$dockerfile_path" ]; then
        echo "❌ Dockerfile not found: $dockerfile_path"
        continue
    fi
    
    # 이미지 빌드
    docker build -t "$image_name" -f "$dockerfile_path" "$BASE_DIR"
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully built $image_name"
    else
        echo "❌ Failed to build $image_name"
    fi
    
    echo "---"
done

echo "🎉 Docker image build process completed!"

# 빌드된 이미지 목록 표시
echo ""
echo "📋 Built images:"
docker images | grep "vibe-coding-"