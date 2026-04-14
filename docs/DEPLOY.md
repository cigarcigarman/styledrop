# 배포 가이드 — StyleDrop

## 인프라 구성

```
[유저 브라우저 PWA]
        ↓
   [Vercel CDN]
   Next.js 14 App
        ↓
   [Supabase]          [Replicate API]    [토스페이먼츠]
   DB + Auth           Flux LoRA 생성     카드 결제
   Storage
```

---

## 1. 로컬 개발 환경 세팅

### 필수 설치
```bash
node >= 18
npm >= 9
npx supabase CLI
```

### 프로젝트 초기화
```bash
# 1. 프로젝트 생성
npx create-next-app@latest styledrop \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"

cd styledrop

# 2. 의존성 설치
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  replicate \
  next-pwa \
  zustand

npm install -D \
  supabase \
  @types/node

# 3. Supabase 로컬 시작
npx supabase init
npx supabase start

# 4. 스키마 적용
npx supabase db push

# 5. 환경변수 설정
cp .env.example .env.local
# .env.local 값 채우기
```

### .env.local
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-local-service-role-key

# Replicate
REPLICATE_API_TOKEN=r8_xxxxxxxxxxxx

# 토스페이먼츠 (테스트 키)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxxxxxxxxxx
TOSS_SECRET_KEY=test_sk_xxxxxxxxxxxx

# 앱
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2. Supabase 프로덕션 세팅

### 프로젝트 생성
```bash
# supabase.com 에서 새 프로젝트 생성
# 리전: Northeast Asia (Seoul)

# 로컬 → 프로덕션 마이그레이션
npx supabase link --project-ref your-project-ref
npx supabase db push

# 카카오 소셜 로그인 설정
# Supabase Dashboard → Auth → Providers → Kakao
# Kakao Developers 에서 REST API 키 발급 후 입력
```

### Storage 버킷 생성
```bash
# Supabase Dashboard → Storage → New bucket
# 이름: generations
# Public: false (유저 본인만 접근)
```

---

## 3. Vercel 배포

### 초기 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add REPLICATE_API_TOKEN
vercel env add NEXT_PUBLIC_TOSS_CLIENT_KEY
vercel env add TOSS_SECRET_KEY
vercel env add NEXT_PUBLIC_APP_URL
```

### 도메인 연결
```bash
# Vercel Dashboard → Domains → Add
# styledrop.kr (가비아/후이즈에서 구매)
# DNS: CNAME → cname.vercel-dns.com
```

### 자동 배포 설정
```bash
# GitHub 연결 → main 브랜치 push 시 자동 배포
vercel --prod  # 수동 프로덕션 배포
```

---

## 4. 토스페이먼츠 프로덕션 전환

```bash
# 토스페이먼츠 대시보드 → 상점 정보 등록
# 사업자 등록증 없으면: 개인 판매자로 등록 가능
# 심사 기간: 영업일 2-3일

# 심사 완료 후 프로덕션 키로 교체
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_xxxxxxxxxxxx
TOSS_SECRET_KEY=live_sk_xxxxxxxxxxxx
```

---

## 5. PWA 설정

### next.config.js
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  // 기존 next 설정
})
```

### public/manifest.json
```json
{
  "name": "StyleDrop",
  "short_name": "StyleDrop",
  "description": "좋아하는 작가 화풍으로 AI 이미지 만들기",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## 6. Replicate LoRA 학습 방법

### 작가 온보딩 시 진행
```bash
# 1. 작가에게 그림 50-100장 받기
#    - 같은 화풍의 다양한 구도
#    - 1024x1024 권장, 최소 512x512
#    - 배경 다양하게

# 2. Replicate에서 Flux LoRA 학습
# https://replicate.com/ostris/flux-dev-lora-trainer/train
# input_images: zip 파일로 업로드
# trigger_word: 작가명 기반 (예: mochimochi_style)
# steps: 1000-2000
# 비용: 약 $2-3 (2,700-4,000원)

# 3. 학습 완료 후 version hash 받아서
#    artists 테이블에 replicate_model_version 업데이트
```

---

## 7. 배포 체크리스트

### 런칭 전 필수 확인
```
□ Supabase RLS 정책 전체 동작 확인
□ 토스 결제 → 크레딧 지급 흐름 실 결제 테스트
□ Replicate 생성 → Storage 저장 흐름 확인
□ NSFW 필터 동작 확인
□ 크레딧 0일 때 생성 시도 → 402 반환 확인
□ 모바일 Safari PWA 홈화면 추가 테스트
□ 모바일 Chrome 결제 플로우 테스트
□ Vercel 환경변수 전체 설정 확인
□ 작가 샘플 이미지 업로드 완료
□ 작가 LoRA 모델 동작 확인 (품질 검수)
```
