// 토스페이먼츠 서버 결제 검증 — 서버에서만 사용

export const CREDIT_PACKAGES = {
  990: 1,
  4500: 5,
} as const

export type PackageAmount = keyof typeof CREDIT_PACKAGES

export function isValidAmount(amount: number): amount is PackageAmount {
  return amount in CREDIT_PACKAGES
}

export function creditsForAmount(amount: PackageAmount): number {
  return CREDIT_PACKAGES[amount]
}

export async function confirmTossPayment({
  paymentKey,
  orderId,
  amount,
}: {
  paymentKey: string
  orderId: string
  amount: number
}) {
  const secretKey = process.env.TOSS_SECRET_KEY
  if (!secretKey) throw new Error('TOSS_SECRET_KEY not configured')

  const encoded = Buffer.from(`${secretKey}:`).toString('base64')

  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string; code?: string }
    throw new Error(err.message ?? `Toss confirm failed: ${res.status}`)
  }

  return res.json()
}
