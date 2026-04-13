# 개발 태스크 — StyleDrop

각 Phase 완료 후 `npm run typecheck`로 확인. 완료된 항목은 `[x]`로 표시.

---

## Phase 1: 프로젝트 초기화 (1-2시간)

### 태스크
- [ ] Next.js 14 프로젝트 생성 (App Router, TypeScript, Tailwind)
- [ ] Supabase 클라이언트 설정 (`lib/supabase/`)
- [ ] 환경변수 파일 생성 (`.env.local`)
- [ ] 기본 폴더 구조 생성
- [ ] `SCHEMA.md`의 SQL을 Supabase 대시보드에서 실행

### Claude Code 프롬프트
```
docs/SCHEMA.md를 읽어줘.

다음을 실행해:
1. Next.js 14 프로젝트 생성:
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

2. 패키지 설치:
   npm install @supabase/supabase-js @supabase/ssr replicate stripe

3. 폴더 구조 생성:
   - app/actions/
   - app/api/generate/[id]/
   - app/api/webhook/replicate/
   - app/api/webhook/stripe/
   - app/api/checkout/
   - app/(auth)/login/
   - app/(auth)/signup/
   - app/dashboard/
   - app/generate/
   - app/pricing/
   - components/ui/
   - components/generation/
   - lib/supabase/

4. lib/supabase/client.ts (브라우저용)
5. lib/supabase/server.ts (서버용, cookies)
6. lib/supabase/service.ts (서비스 롤)
7. lib/replicate.ts (docs/API.md 참조)
8. .env.local.example 생성

TypeScript strict mode로, any 사용 금지.
```

---

## Phase 2: 인증 (2-3시간)

### 태스크
- [ ] 로그인 페이지 (`app/(auth)/login/page.tsx`)
- [ ] 회원가입 페이지 (`app/(auth)/signup/page.tsx`)
- [ ] 인증 미들웨어 (`middleware.ts`)
- [ ] 인증 콜백 라우트 (`app/auth/callback/route.ts`)
- [ ] 로그인/로그아웃 서버 액션

### Claude Code 프롬프트
```
Supabase Auth를 사용한 이메일/비밀번호 인증을 구현해줘.

구현할 것:
1. middleware.ts — /dashboard, /generate 경로를 인증 필요로 보호
2. app/auth/callback/route.ts — OAuth 콜백 처리
3. app/(auth)/login/page.tsx — 로그인 폼
4. app/(auth)/signup/page.tsx — 회원가입 폼
5. app/actions/auth.ts — 로그인/회원가입/로그아웃 서버 액션

UI는 Tailwind만 사용, 외부 컴포넌트 라이브러리 없이.
에러 메시지는 한국어로.
성공 시 /dashboard로 리다이렉트.
```

---

## Phase 3: 이미지 생성 (3-4시간)

### 태스크
- [ ] 생성 폼 컴포넌트 (`components/generation/GenerateForm.tsx`)
- [ ] 생성 서버 액션 (`app/actions/generate.ts`)
- [ ] Replicate 웹훅 라우트 (`app/api/webhook/replicate/route.ts`)
- [ ] 생성 상태 폴링 훅 (`hooks/useGeneration.ts`)
- [ ] 생성 결과 표시 컴포넌트

### Claude Code 프롬프트
```
docs/API.md를 읽어줘.

이미지 생성 플로우를 구현해줘:

1. app/actions/generate.ts
   - 인증 확인
   - 크레딧 확인 (부족 시 에러)
   - generations 레코드 생성
   - deduct_credits DB 함수 호출
   - Replicate API 호출 (lib/replicate.ts)
   - prediction ID 저장
   
2. app/api/webhook/replicate/route.ts
   - Replicate 완료 콜백 처리
   - succeeded: 이미지 URL 저장
   - failed: 크레딧 환불 (add_credits 함수)

3. hooks/useGeneration.ts
   - generation ID로 Supabase realtime 구독 또는 2초 폴링
   - status가 succeeded/failed면 중단

4. components/generation/GenerateForm.tsx
   - 프롬프트 입력 (최대 500자)
   - 스타일 프리셋 선택 버튼 (casual/formal/streetwear/vintage/minimal)
   - 생성 중 로딩 상태
   - 결과 이미지 표시 + 다운로드 버튼

크레딧 부족 시 /pricing 페이지로 안내.
```

---

## Phase 4: 대시보드 갤러리 (2시간)

### 태스크
- [ ] 대시보드 페이지 (`app/dashboard/page.tsx`)
- [ ] 갤러리 그리드 컴포넌트
- [ ] 크레딧 잔액 표시
- [ ] 무한 스크롤 또는 페이지네이션

### Claude Code 프롬프트
```
app/dashboard/page.tsx를 구현해줘.

포함할 것:
1. 상단: 유저 이름, 크레딧 잔액, "이미지 생성하기" 버튼
2. 본문: 내 생성 이력 갤러리 (그리드, 최신순)
   - 각 카드: 이미지 썸네일, 프롬프트 일부, 생성일
   - status가 processing이면 로딩 스켈레톤
   - status가 failed면 실패 표시
3. "더 불러오기" 버튼 (12개씩 페이지네이션)

서버 컴포넌트로 초기 12개 로드.
Supabase 쿼리에 RLS 자동 적용됨.
```

---

## Phase 5: 결제 (2-3시간)

### 태스크
- [ ] 가격 페이지 (`app/pricing/page.tsx`)
- [ ] Stripe 체크아웃 라우트 (`app/api/checkout/route.ts`)
- [ ] Stripe 웹훅 라우트 (`app/api/webhook/stripe/route.ts`)
- [ ] 결제 성공 후 크레딧 지급 확인

### Claude Code 프롬프트
```
docs/API.md의 결제 섹션을 읽어줘.

결제 시스템을 구현해줘:

1. app/pricing/page.tsx
   - credit_packages 테이블에서 패키지 목록 조회
   - 각 패키지 카드: 이름, 크레딧 수, 가격, 이미지당 단가
   - "구매하기" 버튼 → /api/checkout 호출 → Stripe 리다이렉트
   - 현재 로그인 유저의 크레딧 잔액 표시

2. app/api/checkout/route.ts
   - docs/API.md 구현 그대로 사용
   - 비로그인 시 /login 리다이렉트

3. app/api/webhook/stripe/route.ts
   - checkout.session.completed 이벤트 처리
   - add_credits DB 함수로 크레딧 지급
   - 중복 처리 방지 (payment_intent_id 확인)

로컬 테스트: stripe listen --forward-to localhost:3000/api/webhook/stripe
```

---

## Phase 6: 폴리싱 + 배포 준비 (2시간)

### 태스크
- [ ] 랜딩 페이지 (`app/page.tsx`)
- [ ] 에러 바운더리 (`app/error.tsx`)
- [ ] 로딩 UI (`app/loading.tsx`, `app/dashboard/loading.tsx`)
- [ ] 메타데이터 설정 (SEO)
- [ ] `npm run typecheck` 통과
- [ ] `npm run build` 통과

### Claude Code 프롬프트
```
배포 전 폴리싱 작업:

1. app/page.tsx — 랜딩 페이지
   - 히어로: "AI로 나만의 패션 스타일을 시각화하세요"
   - 생성 예시 이미지 3-4개 (placeholder 사용)
   - 기능 소개 3개
   - 가격 섹션 (pricing 페이지 링크)
   - CTA: "무료로 시작하기 (크레딧 5개 제공)"

2. app/error.tsx — 글로벌 에러 UI
3. app/dashboard/error.tsx
4. app/generate/page.tsx — /generate 경로에서 바로 생성 폼
5. 모든 페이지 metadata export 추가

npm run typecheck 실행해서 에러 모두 수정해줘.
```

---

## Phase 7: 배포 (docs/DEPLOY.md 참조)

- [ ] Supabase 프로젝트 프로덕션 설정
- [ ] Vercel 배포
- [ ] 환경변수 설정
- [ ] Stripe 웹훅 프로덕션 등록
- [ ] 도메인 연결

---

## 버그 수정 / 작업 중 발생하는 문제

이슈가 생기면 여기에 기록:

```
# 예시
- [ ] 이미지 생성 후 갤러리 자동 갱신 안 되는 문제
- [ ] 모바일에서 생성 폼 레이아웃 깨짐
```
