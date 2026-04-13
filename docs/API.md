# API 설계 — StyleDrop

## 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | `/api/generate` | 이미지 생성 요청 | 필요 |
| GET | `/api/generate/[id]` | 생성 상태 조회 | 필요 |
| POST | `/api/webhook/replicate` | Replicate 완료 콜백 | 서명 검증 |
| POST | `/api/checkout` | Stripe 결제 세션 생성 | 필요 |
| POST | `/api/webhook/stripe` | Stripe 결제 완료 콜백 | 서명 검증 |
| GET | `/api/credits` | 현재 크레딧 잔액 | 필요 |

---

## POST /api/generate

### Request
```typescript
{
  prompt: string;           // 필수, 최대 500자
  negative_prompt?: string; // 선택
  style_preset?: 'casual' | 'formal' | 'streetwear' | 'vintage' | 'minimal';
  width?: 768 | 1024;      // 기본 1024
  height?: 768 | 1024;     // 기본 1024
}
```

### Response (202 Accepted)
```typescript
{
  generation_id: string;
  status: 'pending';
  credits_remaining: number;
}
```

### Error Responses
```typescript
// 401 Unauthorized
{ error: 'Authentication required' }

// 402 Payment Required
{ error: 'Insufficient credits', credits_remaining: number }

// 422 Unprocessable Entity
{ error: 'Prompt is required' }

// 429 Too Many Requests
{ error: 'Rate limit exceeded. Max 10 requests per minute.' }
```

### 서버 액션 구현 (`app/actions/generate.ts`)
```typescript
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { replicateClient } from '@/lib/replicate'

export async function generateImage(input: GenerateInput) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error('Authentication required')

  // 크레딧 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credits < 1) {
    throw new Error('Insufficient credits')
  }

  // generations 레코드 생성
  const { data: generation } = await supabase
    .from('generations')
    .insert({
      user_id: user.id,
      prompt: input.prompt,
      negative_prompt: input.negative_prompt,
      style_preset: input.style_preset,
      status: 'pending',
    })
    .select()
    .single()

  // 크레딧 선차감 (DB 함수)
  const { data: deducted } = await supabase
    .rpc('deduct_credits', {
      p_user_id: user.id,
      p_amount: 1,
      p_generation_id: generation.id,
    })

  if (!deducted) throw new Error('Credit deduction failed')

  // Replicate 호출
  const prediction = await replicateClient.generate({
    prompt: buildPrompt(input),
    width: input.width ?? 1024,
    height: input.height ?? 1024,
  })

  // prediction ID 업데이트
  await supabase
    .from('generations')
    .update({
      replicate_prediction_id: prediction.id,
      status: 'processing',
    })
    .eq('id', generation.id)

  return { generation_id: generation.id, status: 'pending' }
}
```

---

## POST /api/webhook/replicate

Replicate이 이미지 생성 완료 시 호출하는 웹훅.

### 구현 (`app/api/webhook/replicate/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Replicate 웹훅 서명 검증 (선택적이지만 권장)
  const prediction = body as ReplicatePrediction

  const supabase = createServiceClient() // service role

  const { data: generation } = await supabase
    .from('generations')
    .select('id, user_id')
    .eq('replicate_prediction_id', prediction.id)
    .single()

  if (!generation) return NextResponse.json({ ok: true })

  if (prediction.status === 'succeeded' && prediction.output?.[0]) {
    // 이미지를 Supabase Storage로 복사
    const imageUrl = await downloadAndStore(
      prediction.output[0],
      generation.user_id,
      generation.id,
      supabase
    )

    await supabase
      .from('generations')
      .update({
        status: 'succeeded',
        image_url: imageUrl,
        replicate_url: prediction.output[0],
        completed_at: new Date().toISOString(),
      })
      .eq('id', generation.id)

  } else if (prediction.status === 'failed') {
    // 크레딧 환불
    await supabase.rpc('add_credits', {
      p_user_id: generation.user_id,
      p_amount: 1,
      p_type: 'refund',
      p_description: '이미지 생성 실패 환불',
    })

    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: prediction.error,
      })
      .eq('id', generation.id)
  }

  return NextResponse.json({ ok: true })
}
```

---

## POST /api/checkout

### Request
```typescript
{ package_id: string }
```

### Response
```typescript
{ checkout_url: string }
```

### 구현 (`app/api/checkout/route.ts`)
```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { package_id } = await req.json()

  const { data: pkg } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('id', package_id)
    .single()

  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `StyleDrop ${pkg.name} — ${pkg.credits} Credits`,
        },
        unit_amount: pkg.price_usd,
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: {
      user_id: user.id,
      package_id: pkg.id,
      credits: pkg.credits.toString(),
    },
  })

  return NextResponse.json({ checkout_url: session.url })
}
```

---

## POST /api/webhook/stripe

### 구현 (`app/api/webhook/stripe/route.ts`)
```typescript
export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { user_id, credits } = session.metadata!

    const supabase = createServiceClient()
    await supabase.rpc('add_credits', {
      p_user_id: user_id,
      p_amount: parseInt(credits),
      p_type: 'purchase',
      p_description: `크레딧 구매 (${credits}개)`,
      p_stripe_payment_intent_id: session.payment_intent as string,
    })
  }

  return NextResponse.json({ ok: true })
}
```

---

## Replicate 설정 (`lib/replicate.ts`)

```typescript
import Replicate from 'replicate'

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

const FASHION_SYSTEM_PROMPT = `Fashion photography style, high quality, detailed clothing, professional lighting`

export const replicateClient = {
  async generate(params: {
    prompt: string
    width: number
    height: number
  }) {
    const prediction = await replicate.predictions.create({
      model: 'black-forest-labs/flux-schnell',
      input: {
        prompt: `${FASHION_SYSTEM_PROMPT}, ${params.prompt}`,
        width: params.width,
        height: params.height,
        num_outputs: 1,
        output_format: 'webp',
        output_quality: 90,
      },
      webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/replicate`,
      webhook_events_filter: ['completed'],
    })

    return prediction
  }
}

function buildPrompt(input: GenerateInput): string {
  const styleMap = {
    casual: 'casual everyday fashion, relaxed style',
    formal: 'formal business attire, professional look',
    streetwear: 'urban streetwear, contemporary fashion',
    vintage: 'vintage retro fashion, classic style',
    minimal: 'minimalist fashion, clean lines, neutral colors',
  }
  const stylePrefix = input.style_preset ? styleMap[input.style_preset] + ', ' : ''
  return `${stylePrefix}${input.prompt}`
}
```

---

## 폴링 방식 (웹훅 대안)

웹훅 설정이 복잡한 개발 환경에서는 클라이언트 폴링 사용:

```typescript
// hooks/useGeneration.ts
export function useGeneration(generationId: string) {
  const [generation, setGeneration] = useState<Generation | null>(null)

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('generations')
        .select('*')
        .eq('id', generationId)
        .single()

      if (data) {
        setGeneration(data)
        if (data.status === 'succeeded' || data.status === 'failed') {
          clearInterval(interval)
        }
      }
    }, 2000) // 2초마다

    return () => clearInterval(interval)
  }, [generationId])

  return generation
}
```
