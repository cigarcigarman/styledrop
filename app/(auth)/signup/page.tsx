'use client'

import { signUp } from '@/app/actions/auth'
import Link from 'next/link'
import { useTransition, useState } from 'react'

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await signUp(formData)
      if (result?.error) setError(result.error)
      if (result?.success) setSuccess(result.success)
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">StyleDrop</h1>
            <p className="mt-2 text-sm text-gray-500">
              가입 시 크레딧 5개가 무료로 지급됩니다
            </p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="text-4xl mb-4">📬</div>
              <p className="text-sm text-gray-700">{success}</p>
              <Link
                href="/login"
                className="mt-6 inline-block text-sm font-medium text-black hover:underline"
              >
                로그인으로 이동
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  이메일
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="6자 이상"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPending ? '처리 중...' : '무료로 시작하기'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-medium text-black hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
