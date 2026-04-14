# API 설계 — StyleDrop

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|---|---|---|---|
| POST | /api/generate | 이미지 생성 요청 | 필요 |
| GET | /api/generate/[id] | 생성 결과 폴링 | 필요 |
| POST | /api/payment/confirm | 결제 검증 + 크레딧 지급 | 필요 |
| GET | /api/artists | 작가 목록 | 불필요 |

---

## POST /api/generate

### Request
```typescript
{
  artistId: string   // artists.id
  prompt: string     // 유저 입력 프롬프트
}
```

### 처리 순서
```
1. 세션 확인 (미인증 → 401)
2. 크레딧 잔액 확인 (0 이하 → 402)
3. 작가 존재 + 활성 확인
4. 작가 일일 한도 확인 (오늘 생성 수 조회)
5. 금지 키워드 체크 → 포함 시 400
6. NSFW 네거티브 프롬프트 강제 삽입
7. Replicate prediction 생성
8. generations 테이블 insert (status: pending)
9. credits 1 차감 (트랜잭션)
10. predictionId 반환
```

### Response
```typescript
// 200
{ generationId: string, predictionId: string }

// 400: 금지 키워드
{ error: 'BANNED_KEYWORD', keyword: string }

// 401: 미인증
{ error: 'UNAUTHORIZED' }

// 402: 크레딧 부족
{ error: 'INSUFFICIENT_CREDITS', current: number }

// 429: 일일 한도 초과
{ error: 'DAILY_LIMIT_EXCEEDED' }
```

---

## GET /api/generate/[predictionId]

### 폴링 주기: 3초 간격, 최대 2분

### 처리 순서
```
1. Replicate prediction 상태 조회
2. succeeded → NSFW 후처리 필터
3. 통과 시 → Supabase Storage 업로드
4. generations 업데이트 (status: done, result_url)
5. failed/filtered → generations 업데이트 + 크레딧 환불
```

### Response
```typescript
// 생성 중
{ status: 'pending' }

// 완료
{ status: 'done', imageUrl: string }

// 실패 (크레딧 환불됨)
{ status: 'failed' }

// 필터링 (크레딧 환불됨)
{ status: 'filtered', reason: 'NSFW_DETECTED' }
```

---

## POST /api/payment/confirm

### Request
```typescript
{
  paymentKey: string   // 토스 결제 키
  orderId: string      // 주문 ID (클라이언트에서 생성)
  amount: number       // 결제 금액 (원)
}
```

### 처리 순서
```
1. 세션 확인
2. 토스 서버 결제 검증 API 호출
3. 금액 검증 (990 or 4500)
4. payments insert (status: done)
5. 크레딧 지급
   - 990원 → 1크레딧
   - 4500원 → 5크레딧
6. 크레딧 잔액 반환
```

### Response
```typescript
// 200
{ creditsGranted: number, totalCredits: number }

// 400: 금액 불일치
{ error: 'AMOUNT_MISMATCH' }

// 409: 이미 처리된 결제
{ error: 'ALREADY_PROCESSED' }
```

---

## Replicate 설정

```typescript
// lib/replicate.ts

const FORCED_NEGATIVE = [
  "nsfw", "nude", "explicit", "sexual", "adult content",
  "violence", "gore", "blood", "realistic person", "real face",
  "child", "minor", "underage"
].join(", ")

export async function createPrediction({
  modelVersion,
  triggerWord,
  userPrompt,
  bannedKeywords,
}: {
  modelVersion: string
  triggerWord: string
  userPrompt: string
  bannedKeywords: string[]
}) {
  // 금지 키워드 체크
  const lower = userPrompt.toLowerCase()
  for (const kw of bannedKeywords) {
    if (lower.includes(kw.toLowerCase())) {
      throw new Error(`BANNED_KEYWORD:${kw}`)
    }
  }

  return await replicate.predictions.create({
    version: modelVersion,
    input: {
      prompt: `${triggerWord}, ${userPrompt}`,
      negative_prompt: FORCED_NEGATIVE,
      num_inference_steps: 28,
      guidance_scale: 3.5,
      width: 1024,
      height: 1024,
      output_format: "webp",
      output_quality: 85,
    }
  })
}
```

---

## 크레딧 차감 (동시성 안전)

```sql
-- Supabase Edge Function 또는 서버에서 실행
-- 동시 요청에도 음수 방지
create or replace function deduct_credit(p_user_id uuid)
returns boolean as $$
declare
  v_current integer;
begin
  select amount into v_current
  from credits
  where user_id = p_user_id
  for update;  -- row lock

  if v_current < 1 then
    return false;
  end if;

  update credits
  set amount = amount - 1,
      updated_at = now()
  where user_id = p_user_id;

  return true;
end;
$$ language plpgsql;
```
