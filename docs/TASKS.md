# 개발 태스크 — StyleDrop
> Claude Code 터미널에서 순서대로 진행

---

## Phase 1: 기반 세팅 (Day 1-2)

### 목표
프로젝트 구조 + 디자인 시스템 + 레이아웃 완성

### 태스크
```
□ 1-1. Next.js 14 프로젝트 생성
        npx create-next-app@latest styledrop --typescript --tailwind --app

□ 1-2. 의존성 설치
        @supabase/supabase-js @supabase/ssr replicate next-pwa zustand

□ 1-3. 폴더 구조 생성
        app/ components/ lib/ hooks/ types/ supabase/ docs/

□ 1-4. 디자인 토큰 설정
        globals.css에 CSS 변수 추가
        tailwind.config.ts에 커스텀 색상 추가

□ 1-5. 기본 레이아웃
        app/layout.tsx - 모바일 max-w-[430px] 중앙 정렬
        components/layout/BottomNav.tsx
        components/layout/Header.tsx

□ 1-6. PWA 설정
        public/manifest.json
        next.config.js에 next-pwa 추가

□ 1-7. Supabase 로컬 세팅
        npx supabase init
        npx supabase start
        supabase/migrations/001_initial.sql 작성 (SCHEMA.md 기준)
        npx supabase db push

□ 1-8. 환경변수 설정
        .env.local 작성
        .env.example 작성 (키 값 없이)
```

### Claude Code 프롬프트
```
docs/PRD.md와 docs/SCHEMA.md를 읽고 Phase 1을 시작해줘.

1. Next.js 14 App Router + TypeScript + Tailwind 프로젝트 기반에서
2. 모바일 우선 레이아웃 (max-w-[430px] 중앙 정렬)
3. CSS 변수로 디자인 토큰 설정:
   --bg: #0a0a0a
   --surface: #141414
   --surface2: #1e1e1e
   --border: #2a2a2a
   --text: #f0f0f0
   --text2: #888888
   --accent: #c8ff00
4. BottomNav (갤러리/만들기/내계정 3탭)
5. Header 컴포넌트
6. Supabase 마이그레이션 파일 (SCHEMA.md 기준)
```

---

## Phase 2: 갤러리 (Day 3-5)

### 목표
작가 갤러리 메인 페이지 완성

### 태스크
```
□ 2-1. Supabase 클라이언트 설정
        lib/supabase/client.ts (브라우저용)
        lib/supabase/server.ts (서버 컴포넌트용)
        types/database.ts (DB 타입)

□ 2-2. 작가 갤러리 페이지
        app/page.tsx
        Supabase에서 artists + artist_samples fetch
        2열 그리드 레이아웃

□ 2-3. ArtistCard 컴포넌트
        components/artist/ArtistCard.tsx
        샘플 이미지 2×2 그리드
        작가명 + [만들기] 버튼

□ 2-4. 스켈레톤 로딩
        components/ui/Skeleton.tsx
        갤러리 로딩 상태

□ 2-5. 작가 더미 데이터
        supabase/seed.sql
        테스트용 작가 2명 + 샘플 이미지
```

### Claude Code 프롬프트
```
Phase 2: 작가 갤러리를 만들어줘.

lib/supabase/client.ts와 server.ts를 먼저 만들고,
app/page.tsx에서 Supabase로 artists 데이터를 fetch해서
ArtistCard 2열 그리드로 보여줘.

ArtistCard는:
- 샘플 이미지 2×2 그리드 (aspect-ratio: 1)
- 작가명 (@handle)
- 가격 표시
- [이 화풍으로 만들기] 버튼 (accent 색상)

Skeleton 로딩도 포함해줘.
```

---

## Phase 3: 생성 스튜디오 (Day 6-10)

### 목표
Replicate LoRA 이미지 생성 + NSFW 필터 완성

### 태스크
```
□ 3-1. Replicate 클라이언트
        lib/replicate.ts
        createPrediction 함수 (API.md 기준)
        FORCED_NEGATIVE 포함
        금지 키워드 체크 포함

□ 3-2. 생성 API 라우트
        app/api/generate/route.ts (POST)
        app/api/generate/[predictionId]/route.ts (GET 폴링)

□ 3-3. 스튜디오 페이지
        app/studio/page.tsx
        화풍 선택 (가로 스크롤 칩)
        프롬프트 입력창
        예시 프롬프트 버튼 3개
        [생성하기] 버튼
        크레딧 잔액 표시

□ 3-4. 생성 결과 컴포넌트
        components/studio/ResultViewer.tsx
        로딩 중 / 완료 / 실패 상태
        [저장] [다시 생성] 버튼

□ 3-5. 이미지 저장
        Supabase Storage에 업로드
        다운로드 기능

□ 3-6. 크레딧 차감 로직
        deduct_credit SQL 함수 적용

□ 3-7. 크레딧 없을 때 UX
        402 에러 시 충전 유도 모달
```

### Claude Code 프롬프트
```
Phase 3: AI 생성 스튜디오를 만들어줘.

docs/API.md를 읽고:

1. lib/replicate.ts - createPrediction 함수
   - FORCED_NEGATIVE 네거티브 프롬프트 강제
   - 금지 키워드 체크
   - Flux LoRA 설정

2. app/api/generate/route.ts (POST)
   - 인증 확인 → 크레딧 확인 → 생성 → 크레딧 차감

3. app/api/generate/[predictionId]/route.ts (GET)
   - Replicate 상태 폴링
   - 완료 시 Supabase Storage 저장

4. app/studio/page.tsx
   - 보유 크레딧 있는 작가 선택
   - 프롬프트 입력
   - 3초 폴링으로 결과 확인
   - 저장 버튼

크레딧 없으면 충전 페이지로 유도해줘.
```

---

## Phase 4: 결제 (Day 11-14)

### 목표
카카오 소셜 로그인 + 토스 결제 + 크레딧 지급

### 태스크
```
□ 4-1. Supabase Auth 설정
        카카오 소셜 로그인 설정
        lib/supabase/auth.ts
        middleware.ts (인증 보호)

□ 4-2. 로그인 페이지
        app/login/page.tsx
        카카오 로그인 버튼

□ 4-3. 토스페이먼츠 연동
        lib/toss.ts
        app/charge/page.tsx (상품 선택)

□ 4-4. 결제 API
        app/api/payment/confirm/route.ts
        토스 서버 검증 → 크레딧 지급

□ 4-5. 결제 성공/실패 페이지
        app/charge/success/page.tsx
        app/charge/fail/page.tsx
```

### Claude Code 프롬프트
```
Phase 4: 인증과 결제를 만들어줘.

1. Supabase Auth 카카오 로그인
   - middleware.ts로 /studio, /my, /charge 보호
   - 미인증 → /login 리다이렉트

2. 토스페이먼츠 결제
   - app/charge/page.tsx: 1회(990원), 5회(4,500원) 선택
   - app/api/payment/confirm/route.ts: 서버에서 검증
   - 성공 시 credits 테이블 업데이트

결제 검증은 반드시 서버에서만 해줘.
클라이언트에서 amount를 신뢰하지 말고
서버에서 orderId에 맞는 금액을 검증해줘.
```

---

## Phase 5: 마이페이지 + QA (Day 15-18)

### 목표
마이페이지 완성 + 전체 플로우 QA

### 태스크
```
□ 5-1. 마이페이지
        app/my/page.tsx
        크레딧 잔액
        생성 기록 4열 그리드

□ 5-2. Toast 알림
        components/ui/Toast.tsx
        생성 완료/실패/필터링 알림

□ 5-3. 에러 핸들링
        app/error.tsx
        각 API 에러 케이스 처리

□ 5-4. 모바일 QA
        iOS Safari 테스트
        Android Chrome 테스트
        PWA 홈화면 추가 테스트

□ 5-5. 성능 최적화
        이미지 next/image 적용
        Suspense 경계 추가
```

---

## Phase 6: 런칭 (Day 19-21)

### 목표
프로덕션 배포 + 실제 작가 데이터 입력

### 태스크
```
□ 6-1. Vercel 배포
        docs/DEPLOY.md 참고
        환경변수 전체 설정

□ 6-2. Supabase 프로덕션 마이그레이션
        npx supabase link
        npx supabase db push

□ 6-3. 토스페이먼츠 라이브 키 전환
        테스트 → 라이브 키

□ 6-4. 작가 데이터 입력
        실제 LoRA 모델 버전 해시
        실제 샘플 이미지

□ 6-5. 배포 체크리스트 확인
        docs/DEPLOY.md 체크리스트

□ 6-6. 소프트 런칭
        작가 본인 트위터 공유
        반응 모니터링 시작
```

---

## 공통 규칙

### 각 Phase 완료 기준
```
□ npm run build 에러 없음
□ npm run typecheck 에러 없음
□ 모바일 브라우저에서 실제 동작 확인
□ 핵심 플로우 수동 테스트 완료
```

### Claude Code 작업 방식
```
1. 태스크 하나씩 진행 (한 번에 여러 개 X)
2. 완료 후 typecheck 실행
3. 에러 나면 즉시 수정 후 다음 진행
4. 큰 변경은 git commit 후 진행
```
