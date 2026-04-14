import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { confirmTossPayment, isValidAmount, creditsForAmount } from '@/lib/toss'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await request.json() as {
    paymentKey?: string
    orderId?: string
    amount?: number
  }
  const { paymentKey, orderId, amount } = body

  if (!paymentKey || !orderId || typeof amount !== 'number') {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 })
  }

  // 금액 검증 (990 또는 4500만 허용)
  if (!isValidAmount(amount)) {
    return NextResponse.json({ error: 'AMOUNT_MISMATCH' }, { status: 400 })
  }

  const service = createServiceClient()

  // 중복 결제 방지
  const { data: existing } = await service
    .from('payments')
    .select('id')
    .eq('payment_key', paymentKey)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'ALREADY_PROCESSED' }, { status: 409 })
  }

  // 토스 서버 결제 검증
  try {
    await confirmTossPayment({ paymentKey, orderId, amount })
  } catch (err) {
    console.error('[Toss] confirm error', err)
    return NextResponse.json({ error: 'PAYMENT_CONFIRM_FAILED' }, { status: 400 })
  }

  const creditsGranted = creditsForAmount(amount)

  // payments insert
  const { error: paymentError } = await service.from('payments').insert({
    user_id: user.id,
    payment_key: paymentKey,
    order_id: orderId,
    amount,
    credits_granted: creditsGranted,
    status: 'done',
  })

  if (paymentError) {
    console.error('[DB] payment insert error', paymentError)
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 })
  }

  // 크레딧 지급
  const { data: credit } = await service
    .from('credits')
    .select('amount')
    .eq('user_id', user.id)
    .single()

  if (credit) {
    await service
      .from('credits')
      .update({ amount: credit.amount + creditsGranted, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
  } else {
    await service.from('credits').insert({ user_id: user.id, amount: creditsGranted })
  }

  const { data: updatedCredit } = await service
    .from('credits')
    .select('amount')
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({
    creditsGranted,
    totalCredits: updatedCredit?.amount ?? creditsGranted,
  })
}
