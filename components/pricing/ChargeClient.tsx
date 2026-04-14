'use client'

import { useState } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    TossPayments: (clientKey: string) => TossPaymentsInstance
  }
}

interface TossPaymentsInstance {
  requestPayment: (
    method: string,
    params: {
      amount: number
      orderId: string
      orderName: string
      successUrl: string
      failUrl: string
      customerName?: string
    }
  ) => Promise<void>
}

const PACKAGES = [
  {
    amount: 990,
    credits: 1,
    label: '1회 이용권',
    badge: null,
    desc: '회당 990원',
  },
  {
    amount: 4500,
    credits: 5,
    label: '5회 이용권',
    badge: '10% 할인',
    desc: '회당 900원',
  },
] as const

interface ChargeClientProps {
  currentCredits: number
  clientKey: string
}

function generateOrderId() {
  return `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function ChargeClient({ currentCredits, clientKey }: ChargeClientProps) {
  const [loading, setLoading] = useState<number | null>(null)
  const [scriptReady, setScriptReady] = useState(false)

  async function handlePay(amount: number, orderName: string) {
    if (!scriptReady || !window.TossPayments) return

    setLoading(amount)
    try {
      const toss = window.TossPayments(clientKey)
      const appUrl = window.location.origin

      await toss.requestPayment('카드', {
        amount,
        orderId: generateOrderId(),
        orderName,
        successUrl: `${appUrl}/charge/success`,
        failUrl: `${appUrl}/charge/fail`,
      })
    } catch (err) {
      // 사용자가 결제 취소한 경우 포함
      const e = err as { code?: string }
      if (e?.code !== 'USER_CANCEL') {
        console.error('[Toss] requestPayment error', err)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <Script
        src="https://js.tosspayments.com/v1/payment"
        onReady={() => setScriptReady(true)}
      />

      <div className="flex flex-col gap-4">
        {/* 현재 잔액 */}
        <div className="flex items-center justify-between p-4 bg-[var(--surface)] rounded-[var(--radius-card)]">
          <span className="text-sm text-[var(--text2)]">현재 잔여 크레딧</span>
          <span className="text-base font-bold text-[var(--accent)]">{currentCredits}개</span>
        </div>

        {/* 상품 목록 */}
        <div className="flex flex-col gap-3">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.amount}
              className="p-4 bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)]"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-[var(--text)]">{pkg.label}</span>
                    {pkg.badge && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--accent)] text-black font-semibold">
                        {pkg.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-[var(--text2)]">{pkg.desc}</span>
                </div>
                <span className="text-lg font-bold text-[var(--text)]">
                  {pkg.amount.toLocaleString()}원
                </span>
              </div>

              <button
                type="button"
                disabled={!scriptReady || loading !== null}
                onClick={() => handlePay(pkg.amount, pkg.label)}
                className="w-full py-3 rounded-[var(--radius-btn)] bg-[var(--accent)] text-black font-semibold text-sm disabled:opacity-40 transition-opacity"
              >
                {loading === pkg.amount ? '처리 중...' : `${pkg.credits}크레딧 충전하기`}
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-[var(--text2)] text-center">
          결제 수단: 신용카드 · 체크카드<br />
          결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
        </p>
      </div>
    </>
  )
}
