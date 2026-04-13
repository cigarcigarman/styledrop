'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { Database } from '@/types/database'

type CreditPackage = Database['public']['Tables']['credit_packages']['Row']

interface PricingClientProps {
  packages: CreditPackage[]
  isLoggedIn: boolean
}

export function PricingClient({ packages, isLoggedIn }: PricingClientProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  async function handlePurchase(packageId: string) {
    if (!isLoggedIn) {
      router.push('/login?redirectTo=/pricing')
      return
    }

    setLoadingId(packageId)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package_id: packageId }),
      })
      const data = await res.json()
      if (data.checkout_url) {
        window.location.href = data.checkout_url
      } else {
        alert('결제 페이지 연결에 실패했습니다.')
      }
    } catch {
      alert('오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoadingId(null)
    }
  }

  const RECOMMENDED = 'Basic'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {packages.map((pkg) => {
        const isRecommended = pkg.name === RECOMMENDED
        const priceUsd = pkg.price_usd / 100
        const perImage = (priceUsd / pkg.credits).toFixed(2)

        return (
          <div
            key={pkg.id}
            className={`relative bg-white rounded-2xl p-6 border-2 transition-all ${
              isRecommended ? 'border-black shadow-md' : 'border-gray-100'
            }`}
          >
            {isRecommended && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-xs px-3 py-1 rounded-full">
                추천
              </span>
            )}

            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-900">{pkg.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-900">${priceUsd}</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                크레딧 <span className="font-semibold text-black">{pkg.credits}개</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">이미지 1장당 ${perImage}</p>
            </div>

            <button
              onClick={() => handlePurchase(pkg.id)}
              disabled={loadingId === pkg.id}
              className={`w-full py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                isRecommended
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {loadingId === pkg.id ? '처리 중...' : '구매하기'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
