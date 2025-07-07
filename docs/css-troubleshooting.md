# CSS 문제 해결 가이드

프론트엔드에서 CSS가 제대로 적용되지 않는 문제를 해결하는 방법을 설명합니다.

## 🔍 문제 진단

### 1. CSS 로드 확인
브라우저에서 페이지를 열고 다음을 확인하세요:

- **우상단에 "CSS 로드됨" 표시**: CSS가 정상적으로 로드됨
- **페이지가 스타일 없이 보임**: CSS 로드 실패

### 2. 개발자 도구 확인
브라우저 개발자 도구(F12)에서:

1. **Network 탭**: CSS 파일이 로드되는지 확인
2. **Console 탭**: CSS 관련 오류 메시지 확인
3. **Elements 탭**: 스타일이 적용되는지 확인

## 🛠 해결 방법

### 1. 의존성 설치 확인

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 또는 yarn 사용
yarn install
```

### 2. 개발 서버 실행

```bash
# 개발 서버 시작
npm run dev

# 또는 yarn 사용
yarn dev
```

### 3. Tailwind CSS 설정 확인

`tailwind.config.js` 파일에서 content 경로가 올바른지 확인:

```javascript
content: [
  './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  './src/app/**/*.{js,ts,jsx,tsx,mdx}',
],
```

### 4. PostCSS 설정 확인

`postcss.config.js` 파일이 올바른지 확인:

```javascript
module.exports = {
  plugins: {
    'tailwindcss/nesting': {},
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 5. CSS 파일 import 확인

`src/app/layout.tsx`에서 CSS 파일이 올바르게 import되었는지 확인:

```typescript
import './globals.css';
```

## 🐳 Docker 환경에서 실행

### 1. Docker Compose로 실행

```bash
# 모든 서비스 시작
./scripts/docker-setup.sh start

# 프론트엔드만 실행
docker-compose up -d frontend
```

### 2. 컨테이너 로그 확인

```bash
# 프론트엔드 로그 확인
docker-compose logs -f frontend

# 빌드 로그 확인
docker-compose logs frontend
```

### 3. 컨테이너 내부 확인

```bash
# 프론트엔드 컨테이너 접속
docker-compose exec frontend sh

# 의존성 확인
npm list tailwindcss
npm list postcss
```

## 🔧 수동 수정

### 1. CSS 파일 수동 빌드

```bash
# Tailwind CSS 수동 빌드
npx tailwindcss -i ./src/app/globals.css -o ./dist/output.css --watch
```

### 2. 캐시 클리어

```bash
# Next.js 캐시 클리어
rm -rf .next

# node_modules 재설치
rm -rf node_modules
npm install
```

### 3. 환경 변수 확인

`.env.local` 파일에서 CSS 관련 설정 확인:

```bash
# 환경 변수 파일 생성
touch .env.local
```

## 📋 체크리스트

### 기본 확인사항
- [ ] Node.js가 설치되어 있음
- [ ] npm 또는 yarn이 설치되어 있음
- [ ] 프로젝트 의존성이 설치됨
- [ ] 개발 서버가 실행 중임

### 파일 확인사항
- [ ] `tailwind.config.js` 파일이 존재함
- [ ] `postcss.config.js` 파일이 존재함
- [ ] `src/app/globals.css` 파일이 존재함
- [ ] `src/app/layout.tsx`에서 CSS를 import함

### 설정 확인사항
- [ ] Tailwind CSS content 경로가 올바름
- [ ] PostCSS 플러그인이 올바름
- [ ] Next.js 설정이 올바름

### 브라우저 확인사항
- [ ] CSS 파일이 네트워크 탭에서 로드됨
- [ ] 콘솔에 CSS 관련 오류가 없음
- [ ] 스타일이 Elements 탭에서 적용됨

## 🚀 테스트 페이지

CSS가 제대로 작동하는지 확인하기 위해 테스트 페이지를 사용하세요:

- **테스트 페이지**: http://localhost:3000/test
- **메인 페이지**: http://localhost:3000

## 🔍 일반적인 문제들

### 1. Tailwind CSS 클래스가 적용되지 않음
- **원인**: Tailwind CSS가 로드되지 않음
- **해결**: `npm install` 후 서버 재시작

### 2. 커스텀 CSS가 적용되지 않음
- **원인**: CSS 파일 경로 문제
- **해결**: import 경로 확인

### 3. 반응형 디자인이 작동하지 않음
- **원인**: Tailwind CSS 설정 문제
- **해결**: `tailwind.config.js` content 경로 확인

### 4. 색상이 적용되지 않음
- **원인**: 커스텀 색상 설정 문제
- **해결**: `tailwind.config.js` theme 설정 확인

## 📞 추가 도움

문제가 지속되면 다음을 확인하세요:

1. **브라우저 캐시 클리어**: Ctrl+F5 (Windows) 또는 Cmd+Shift+R (Mac)
2. **다른 브라우저에서 테스트**: Chrome, Firefox, Safari
3. **개발자 도구에서 오류 확인**: Console 탭에서 오류 메시지
4. **네트워크 탭에서 파일 로드 확인**: CSS 파일이 404 오류 없이 로드되는지 확인 