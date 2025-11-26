# DevPort

> 한국 개발자를 위한 글로벌 트렌드 큐레이션 플랫폼

![DevPort](https://img.shields.io/badge/Status-MVP-blue?style=flat-square)
![React](https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind](https://img.shields.io/badge/Tailwind-3-blue?style=flat-square&logo=tailwindcss)

<!-- TODO: 배포 후 스크린샷 추가 -->

## 🌊 프로젝트 소개

devPort (devport.kr)는 GitHub, Hacker News, Reddit, 주요 기술 블로그의 영문 트렌드 콘텐츠를 수집하여 한국어 한 줄 요약과 함께 제공하는 서비스입니다. 언어 장벽 없이 글로벌 개발 트렌드를 빠르게 파악할 수 있도록 돕습니다.

### 주요 기능

- 🎯 **자동 스크롤 티커** - 실시간 트렌드 요약을 한눈에
- 🏆 **GitHub 트렌딩 리더보드** - 상위 10개 인기 저장소
- 🗂️ **카테고리 필터링** - AI/LLM, DevOps/SRE, Backend, Infra/Cloud 등

## 🛠️ 기술 스택

### 프론트엔드
- **프레임워크**: React 18 + TypeScript
- **빌드 도구**: Vite
- **스타일링**: Tailwind CSS v3

## 🚀 시작하기

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/YOUR_USERNAME/devport-app.git
cd devport-app

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 `http://localhost:5173` 으로 접속하세요.

### 프로덕션 빌드

```bash
npm run build
```

### 주요 엔드포인트 (구현 예정)

- `GET /api/articles` - 카테고리 필터링을 지원하는 페이지네이션 피드
- `GET /api/articles/github-trending` - 상위 10개 GitHub 저장소
- `GET /api/articles/trending-ticker` - 자동 스크롤 티커용 아티클

## 🤝 기여

피드백과 제안은 언제나 환영합니다!

## 📝 라이선스

MIT License

## 👤 만든 사람

- GitHub: [@BrianKimBumsoo](https://github.com/briankim913)
