'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 gap-5 text-center">
      <p className="text-base font-semibold text-[var(--text)]">오류가 발생했습니다</p>
      <p className="text-sm text-[var(--text2)]">잠시 후 다시 시도해주세요.</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-5 py-2.5 rounded-[var(--radius-btn)] bg-[var(--accent)] text-black text-sm font-semibold"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-[var(--radius-btn)] bg-[var(--surface2)] text-[var(--text)] text-sm border border-[var(--border)]"
        >
          홈으로
        </Link>
      </div>
    </div>
  )
}
