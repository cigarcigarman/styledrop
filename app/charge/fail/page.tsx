import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '결제 실패 — StyleDrop' }

const ERROR_MESSAGES: Record<string, string> = {
  PAY_PROCESS_CANCELED: '결제가 취소됐습니다.',
  PAY_PROCESS_ABORTED: '결제가 중단됐습니다.',
  REJECT_CARD_COMPANY: '카드사에서 결제를 거절했습니다.',
  CONFIRM_FAILED: '결제 확인에 실패했습니다. 고객센터에 문의해주세요.',
}

export default function ChargeFailPage({
  searchParams,
}: {
  searchParams: { code?: string; message?: string }
}) {
  const msg =
    ERROR_MESSAGES[searchParams.code ?? ''] ??
    searchParams.message ??
    '결제에 실패했습니다.'

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 gap-6 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--surface2)] border border-[var(--border)] flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M18 6L6 18M6 6l12 12"
            stroke="var(--text2)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div>
        <p className="text-lg font-bold text-[var(--text)]">결제 실패</p>
        <p className="mt-1 text-sm text-[var(--text2)]">{msg}</p>
      </div>

      <Link
        href="/charge"
        className="w-full max-w-xs py-3.5 rounded-[var(--radius-btn)] bg-[var(--surface2)] text-[var(--text)] font-semibold text-sm text-center block border border-[var(--border)]"
      >
        다시 시도하기
      </Link>
    </main>
  )
}
