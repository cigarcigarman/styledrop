# 배포 가이드 — StyleDrop

## 배포 스택
- **앱**: Vercel (Next.js)
- **DB + 인증**: Supabase
- **결제**: Stripe
- **AI**: Replicate
- **도메인**: 별도 구매 (Namecheap, Cloudflare 등)

---

## Step 1: Supabase 프로젝트 설정

### 1-1. 프로젝트 생성
1. [supabase.com](https://supabase.com) → New Project
2. 이름: `styledrop-prod`
3. 리전: Northeast Asia (Seoul) — 한국 유저 기준 가장 빠름
4. DB 비밀번호 안전한 곳에 저장

### 1-2. 스키마 실행
1. Supabase Dashboard → SQL Editor
2. `docs/SCHEMA.md`의 SQL을 순서대로 실행:
   - Extensions
   - Tables
   - RLS Policies
   - Functions
   - Triggers

### 1-3. 키 확인
Settings → API:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (절대 공개 금지)

### 1-4. 인증 설정
Authentication → URL Configuration:
- Site URL: `https://yourdomain.com`
- Redirect URLs: `https://yourdomain.com/auth/callback`

### 1-5. Storage 버킷 생성
Storage → New bucket:
- 이름: `generations`
- Public: **Yes** (이미지 공개 접근)

```sql
-- Storage 정책 추가 (SQL Editor)
create policy "users can upload own images"
  on storage.objects for insert
  with check (bucket_id = 'generations' AND auth.uid()::text = (storage.foldername(name))[1]);

create policy "anyone can view images"
  on storage.objects for select
  using (bucket_id = 'generations');
```

---

## Step 2: Stripe 설정

### 2-1. 계정 설정
1. [stripe.com](https://stripe.com) 계정 생성 + 활성화
2. 실명/사업자 정보 입력 (결제 수취를 위해 필수)

### 2-2. 프로덕션 키 확인
Developers → API keys:
- `STRIPE_SECRET_KEY` (sk_live_...)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_...)

### 2-3. 웹훅 등록
Developers → Webhooks → Add endpoint:
- URL: `https://yourdomain.com/api/webhook/stripe`
- Events: `checkout.session.completed`
- `STRIPE_WEBHOOK_SECRET` 저장

---

## Step 3: Replicate 설정

1. [replicate.com](https://replicate.com) → Account → API tokens
2. 새 토큰 생성
3. `REPLICATE_API_TOKEN` 저장

---

## Step 4: Vercel 배포

### 4-1. GitHub에 코드 푸시
```bash
git init
git add .
git commit -m "initial commit"
gh repo create styledrop --private --push
```

### 4-2. Vercel 연결
1. [vercel.com](https://vercel.com) → New Project
2. GitHub 레포 선택
3. Framework: Next.js (자동 감지)

### 4-3. 환경변수 설정
Vercel Dashboard → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REPLICATE_API_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 4-4. 배포
```bash
# 자동 배포 (main 브랜치 푸시 시 자동)
git push origin main
```

---

## Step 5: 도메인 연결

1. Vercel → Project → Settings → Domains → Add domain
2. DNS 설정:
   - A record: `76.76.21.21`
   - CNAME: `cname.vercel-dns.com`
3. SSL 자동 발급 (수분 소요)

---

## 배포 후 체크리스트

```
[ ] 회원가입 → 크레딧 5개 자동 지급 확인
[ ] 로그인/로그아웃 동작 확인
[ ] 이미지 생성 엔드-투-엔드 테스트 (실제 크레딧 사용)
[ ] Stripe 결제 테스트 (테스트 카드: 4242 4242 4242 4242)
[ ] 결제 후 크레딧 지급 확인
[ ] Replicate 웹훅 수신 확인 (Replicate 대시보드에서)
[ ] 이미지가 Supabase Storage에 저장되는지 확인
[ ] 모바일 브라우저 테스트
```

---

## 로컬 개발 환경

```bash
# Stripe 웹훅 로컬 포워딩
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Replicate 웹훅은 ngrok 사용
ngrok http 3000
# NEXT_PUBLIC_APP_URL을 ngrok URL로 임시 변경

# 개발 서버
npm run dev
```

---

## 모니터링

- **에러**: Vercel → Functions → Logs
- **DB 쿼리**: Supabase → Logs → API
- **결제**: Stripe → Payments
- **AI 사용량**: Replicate → Dashboard → Usage
