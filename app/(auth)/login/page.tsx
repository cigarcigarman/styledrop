'use client'

import { signIn } from '@/app/actions/auth'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useTransition, useState, Suspense } from 'react'

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/dashboard'
  const urlError = searchParams.get('error')

  const [error, setError] = useState<string | null>(urlError)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('redirectTo', redirectTo)

    startTransition(async () => {
      const result = await signIn(formData)
      if (result?.error) setError(result.error)
    })
  }

  return (
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
          autoComplete="current-password"
          required
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
          placeholder="••••••••"
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
        {isPending ? '로그인 중...' : '로그인'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">StyleDrop</h1>
            <p className="mt-2 text-sm text-gray-500">계정에 로그인하세요</p>
          </div>

          <Suspense fallback={<div className="h-40 animate-pulse bg-gray-50 rounded-lg" />}>
            <LoginForm />
          </Suspense>

          <p className="mt-6 text-center text-sm text-gray-500">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="font-medium text-black hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
