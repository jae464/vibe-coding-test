#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Docker 설치 확인
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker가 설치되어 있지 않습니다."
        echo "Docker를 설치해주세요: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose가 설치되어 있지 않습니다."
        echo "Docker Compose를 설치해주세요: https://docs.docker.com/compose/install/"
        exit 1
    fi

    log_success "Docker 및 Docker Compose가 설치되어 있습니다."
}

# 환경 변수 파일 생성
setup_env() {
    log_info "환경 변수 파일을 설정합니다..."
    
    if [ ! -f "backend/.env" ]; then
        cp backend/env.example backend/.env
        log_success "backend/.env 파일이 생성되었습니다."
    else
        log_warning "backend/.env 파일이 이미 존재합니다."
    fi
}

# Docker Compose 실행
start_services() {
    log_info "Docker Compose로 서비스를 시작합니다..."
    
    # 기존 컨테이너 정리
    log_info "기존 컨테이너를 정리합니다..."
    docker-compose down --volumes --remove-orphans
    
    # 서비스 시작
    log_info "서비스를 시작합니다..."
    docker-compose up -d
    
    # 서비스 상태 확인
    log_info "서비스 상태를 확인합니다..."
    docker-compose ps
    
    log_success "모든 서비스가 시작되었습니다!"
}

# 서비스 상태 확인
check_services() {
    log_info "서비스 상태를 확인합니다..."
    
    # PostgreSQL 확인
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        log_success "PostgreSQL이 정상적으로 실행 중입니다."
    else
        log_error "PostgreSQL 연결에 실패했습니다."
    fi
    
    # Redis 확인
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_success "Redis가 정상적으로 실행 중입니다."
    else
        log_error "Redis 연결에 실패했습니다."
    fi
    
    # 백엔드 확인
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        log_success "백엔드 서버가 정상적으로 실행 중입니다."
    else
        log_warning "백엔드 서버가 아직 시작되지 않았습니다. 잠시 후 다시 확인해주세요."
    fi
    
    # 프론트엔드 확인 (선택사항)
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_success "프론트엔드가 정상적으로 실행 중입니다."
    else
        log_warning "프론트엔드가 아직 시작되지 않았습니다. 잠시 후 다시 확인해주세요."
    fi
}

# 로그 확인
show_logs() {
    log_info "서비스 로그를 확인합니다..."
    docker-compose logs -f
}

# 서비스 중지
stop_services() {
    log_info "서비스를 중지합니다..."
    docker-compose down
    log_success "모든 서비스가 중지되었습니다."
}

# 서비스 재시작
restart_services() {
    log_info "서비스를 재시작합니다..."
    docker-compose restart
    log_success "모든 서비스가 재시작되었습니다."
}

# 데이터베이스 마이그레이션
run_migrations() {
    log_info "데이터베이스 마이그레이션을 실행합니다..."
    docker-compose exec backend npm run migration:run
    log_success "마이그레이션이 완료되었습니다."
}

# 메인 함수
main() {
    case "$1" in
        "start")
            check_docker
            setup_env
            start_services
            check_services
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            restart_services
            ;;
        "logs")
            show_logs
            ;;
        "migrate")
            run_migrations
            ;;
        "status")
            check_services
            ;;
        "clean")
            log_info "모든 컨테이너와 볼륨을 정리합니다..."
            docker-compose down -v --remove-orphans
            docker system prune -f
            log_success "정리가 완료되었습니다."
            ;;
        *)
            echo "사용법: $0 {start|stop|restart|logs|migrate|status|clean}"
            echo ""
            echo "명령어:"
            echo "  start   - 모든 서비스를 시작합니다"
            echo "  stop    - 모든 서비스를 중지합니다"
            echo "  restart - 모든 서비스를 재시작합니다"
            echo "  logs    - 서비스 로그를 확인합니다"
            echo "  migrate - 데이터베이스 마이그레이션을 실행합니다"
            echo "  status  - 서비스 상태를 확인합니다"
            echo "  clean   - 모든 컨테이너와 볼륨을 정리합니다"
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@" 