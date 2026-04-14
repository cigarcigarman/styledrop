# StyleDrop — Claude Code Context

## 프로젝트 한 줄 정의
팬이 좋아하는 작가 화풍으로 AI 이미지를 즉시 생성하고 다운로드한다.
작가는 동의 기반 LoRA 모델 등록만 하면 생성될 때마다 수익이 생긴다.

## 빠른 참조
- 전체 PRD: @docs/PRD.md
- DB 스키마: @docs/SCHEMA.md
- API 설계: @docs/API.md
- 배포 가이드: @docs/DEPLOY.md
- 운영 가이드: @docs/OPERATIONS.md

## 기술 스택
- Frontend: Next.js 14 (App Router), TypeScript, Tailwind CSS, PWA
- Backend: Supabase (DB + Auth + Storage + Edge Functions)
- AI: Replicate API (Flux-dev LoRA)
- 결제: 토스페이먼츠
- 배포: Vercel

## 핵심 명령어
```bash
npm run dev          # 개발 서버 (localhost:3000)
npm run build        # 프로덕션 빌드
npm run typecheck    # 타입 체크
npm run lint         # ESLint
npx supabase start   # 로컬 Supabase
npx supabase db push # 마이그레이션 적용
```

## 코드 컨벤션
- TypeScript strict mode ON
- Named exports only (default export 금지, page.tsx 제외)
- 컴포넌트: PascalCase, 파일명도 동일
- 훅: camelCase, use 접두사
- 서버 컴포넌트 기본, 클라이언트 필요 시 'use client' 명시
- 에러 처리: try/catch + Toast 알림, console.error 로깅
- 환경변수: NEXT_PUBLIC_ 접두사는 클라이언트 노출 허용

## 중요 규칙
- 시크릿 키 절대 커밋 금지 (.env.local 사용)
- NSFW 필터 항상 ON (lib/filter.ts)
- 모든 결제 검증은 서버에서 (클라이언트 신뢰 금지)
- 크레딧 차감은 트랜잭션으로 (동시성 문제)
- 이미지 생성 결과 Supabase Storage에 저장 (외부 URL 의존 금지)

## 폴더 구조 요약
```
app/           → Next.js App Router 페이지
components/    → UI 컴포넌트 (feature별 폴더)
lib/           → 외부 서비스 클라이언트 (supabase, replicate, toss)
hooks/         → 커스텀 훅
types/         → TypeScript 타입 정의
supabase/      → 마이그레이션 파일
docs/          → 프로젝트 문서
```
