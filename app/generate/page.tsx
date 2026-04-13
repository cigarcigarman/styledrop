import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GenerateForm } from '@/components/generation/GenerateForm'
import Link from 'next/link'
import { signOut } from '@/app/actions/auth'

export const metadata = {
  title: '이미지 생성 — StyleDrop',
}

export default async function GeneratePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  const credits = profile?.credits ?? 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold text-gray-900">StyleDrop</Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">내 갤러리</Link>
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900">크레딧 충전</Link>
            <form action={signOut}>
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-900">로그아웃</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <GenerateForm credits={credits} />
      </main>
    </div>
  )
}
