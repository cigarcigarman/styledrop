# StyleDrop — Claude Code 세션 컨텍스트

## 프로젝트 개요
AI 패션 스타일 이미지 생성 서비스. 사용자가 텍스트로 스타일을 묘사하면 Replicate API로 패션 이미지를 생성하고, 크레딧 기반으로 과금한다.

## 기술 스택
- **Frontend/Backend**: Next.js 14 (App Router)
- **DB**: Supabase (PostgreSQL)
- **인증**: Supabase Auth
- **결제**: Stripe
- **AI 이미지 생성**: Replicate API (SDXL / FLUX)
- **스토리지**: Supabase Storage
- **배포**: Vercel

## 핵심 문서 경로
- 사업 정의 + PMF 기준 → `docs/PRD.md`
- DB 스키마 (SQL) → `docs/SCHEMA.md`
- API 설계 → `docs/API.md`
- 배포 가이드 → `docs/DEPLOY.md`
- 운영 SQL → `docs/OPERATIONS.md`
- 개발 태스크 + 프롬프트 → `docs/TASKS.md`
- 런칭 플레이북 → `docs/LAUNCH.md`

## 개발 규칙
1. TypeScript strict mode. `any` 사용 금지.
2. 모든 Supabase 쿼리는 RLS 정책을 통과해야 함.
3. Replicate 호출은 항상 `lib/replicate.ts`를 통해서만.
4. 크레딧 차감은 DB 트랜잭션으로 처리 (race condition 방지).
5. 환경변수는 `.env.local`에만, 절대 커밋 금지.
6. 컴포넌트는 `components/`, 서버 액션은 `app/actions/`.
7. Phase 완료마다 `npm run typecheck` 통과 확인.

## 환경변수 목록
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REPLICATE_API_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=
```

## 현재 Phase
`docs/TASKS.md`의 체크리스트를 확인하고 완료되지 않은 첫 번째 태스크부터 시작할 것.
