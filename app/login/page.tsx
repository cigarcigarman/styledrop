import { signInWithKakao } from '@/app/actions/auth'
import { Header } from '@/components/layout/Header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '로그인 — StyleDrop' }

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string }
}) {
  const next = searchParams.next

  return (
    <>
      <Header title="로그인" showBack backHref="/" />
      <main className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--text)]">StyleDrop</p>
          <p className="mt-2 text-sm text-[var(--text2)]">
            좋아하는 작가 화풍으로 AI 이미지 만들기
          </p>
        </div>

        {searchParams.error && (
          <div className="w-full px-4 py-3 bg-red-900/20 border border-red-800 rounded-[var(--radius-card)] text-sm text-red-400 text-center">
            로그인에 실패했습니다. 다시 시도해주세요.
          </div>
        )}

        <form
          action={async () => {
            'use server'
            await signInWithKakao(next)
          }}
          className="w-full"
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-[var(--radius-btn)] bg-[#FEE500] text-[#3A1D1D] font-semibold text-sm"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2C5.58 2 2 4.96 2 8.62c0 2.31 1.53 4.34 3.83 5.49L5 16.5l3.1-2.04c.62.1 1.26.16 1.9.16 4.42 0 8-2.96 8-6.62S14.42 2 10 2z"
                fill="#3A1D1D"
              />
            </svg>
            카카오로 시작하기
          </button>
        </form>

        <p className="text-xs text-[var(--text2)] text-center leading-relaxed">
          로그인 시 이용약관 및 개인정보 처리방침에 동의합니다.
        </p>
      </main>
    </>
  )
}
