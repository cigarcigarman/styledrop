import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { confirmTossPayment, isValidAmount, creditsForAmount } from '@/lib/toss'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '결제 완료 — StyleDrop' }

export default async function ChargeSuccessPage({
  searchParams,
}: {
  searchParams: { paymentKey?: string; orderId?: string; amount?: string }
}) {
  const { paymentKey, orderId, amount: amountStr } = searchParams

  if (!paymentKey || !orderId || !amountStr) {
    redirect('/charge?error=missing_params')
  }

  const amount = parseInt(amountStr, 10)

  if (!isValidAmount(amount)) {
    redirect('/charge?error=invalid_amount')
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/charge')

  const service = createServiceClient()

  // 중복 처리 방지
  const { data: existing } = await service
    .from('payments')
    .select('id, credits_granted')
    .eq('payment_key', paymentKey)
    .single()

  let creditsGranted: number

  if (existing) {
    creditsGranted = existing.credits_granted
  } else {
    // 토스 결제 검증
    try {
      await confirmTossPayment({ paymentKey, orderId, amount })
    } catch (err) {
      console.error('[Toss] confirm error on success page', err)
      redirect('/charge/fail?code=CONFIRM_FAILED')
    }

    creditsGranted = creditsForAmount(amount)

    await service.from('payments').insert({
      user_id: user.id,
      payment_key: paymentKey,
      order_id: orderId,
      amount,
      credits_granted: creditsGranted,
      status: 'done',
    })

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
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 gap-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--accent)] flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="black"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div>
        <p className="text-lg font-bold text-[var(--text)]">결제 완료!</p>
        <p className="mt-1 text-sm text-[var(--text2)]">
          {creditsGranted}크레딧이 충전됐습니다.
        </p>
      </div>

      <Link
        href="/studio"
        className="w-full max-w-xs py-3.5 rounded-[var(--radius-btn)] bg-[var(--accent)] text-black font-semibold text-sm text-center block"
      >
        이미지 만들러 가기
      </Link>
    </main>
  )
}
