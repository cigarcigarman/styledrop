import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/actions/auth'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '크레딧 충전 — StyleDrop',
}

export default async function PricingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const profileRes = user
    ? await supabase.from('profiles').select('credits').eq('id', user.id).single()
    : null
  const credits = profileRes?.data?.credits ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">StyleDrop</Link>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">내 갤러리</Link>
                <form action={signOut}>
                  <button type="submit" className="text-sm text-gray-500 hover:text-gray-900">로그아웃</button>
                </form>
              </>
            ) : (
              <Link href="/login" className="text-sm font-medium text-black">로그인</Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-6">🚧</div>
        <h1 className="text-2xl font-bold text-gray-900">크레딧 충전 준비 중</h1>
        <p className="mt-4 text-gray-500 leading-relaxed">
          현재 베타 서비스 기간입니다.<br />
          충전 기능은 곧 오픈 예정이에요.
        </p>

        {user && (
          <div className="mt-6 inline-flex items-center gap-2 bg-white border border-gray-100 rounded-full px-5 py-2.5 shadow-sm">
            <span className="text-sm text-gray-500">현재 잔액</span>
            <span className="text-sm font-bold text-black">{credits}개</span>
          </div>
        )}

        <div className="mt-8 p-5 bg-white rounded-2xl border border-gray-100 text-left">
          <p className="text-sm font-medium text-gray-900 mb-3">출시 알림 받기</p>
          <a
            href="mailto:styledrop@example.com?subject=크레딧 충전 오픈 알림 신청"
            className="block w-full text-center bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            이메일로 알림 받기
          </a>
        </div>

        <Link
          href={user ? '/generate' : '/signup'}
          className="mt-6 inline-block text-sm text-gray-500 hover:text-gray-900"
        >
          {user ? '← 이미지 생성하러 가기' : '무료로 시작하기 →'}
        </Link>
      </main>
    </div>
  )
}
