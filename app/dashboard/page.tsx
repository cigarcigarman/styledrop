import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { DashboardPoller } from '@/components/dashboard/DashboardPoller'

export const metadata: Metadata = {
  title: '내 갤러리 — StyleDrop',
}

const PAGE_SIZE = 12

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { page?: string; payment?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const [profileRes, generationsRes] = await Promise.all([
    supabase.from('profiles').select('credits, full_name').eq('id', user.id).single(),
    supabase
      .from('generations')
      .select('id, prompt, status, image_url, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to),
  ])

  const credits = profileRes.data?.credits ?? 0
  const displayName = profileRes.data?.full_name ?? user.email?.split('@')[0] ?? '사용자'
  const generations = generationsRes.data ?? []
  const totalCount = generationsRes.count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const hasProcessing = generations.some(
    (g) => g.status === 'processing' || g.status === 'pending'
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">StyleDrop</span>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-gray-500 hover:text-gray-900">크레딧 충전</Link>
            <form action={signOut}>
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-900">로그아웃</button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <DashboardPoller hasProcessing={hasProcessing} />

      {/* 결제 성공 배너 */}
        {searchParams.payment === 'success' && (
          <div className="mb-6 px-4 py-3 bg-green-50 border border-green-100 rounded-lg text-sm text-green-700">
            크레딧이 충전되었습니다!
          </div>
        )}

        {/* 상단 유저 정보 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{displayName}님의 갤러리</h1>
            <p className="mt-0.5 text-sm text-gray-500">
              남은 크레딧: <span className="font-semibold text-black">{credits}개</span>
            </p>
          </div>
          <Link
            href="/generate"
            className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            이미지 생성하기
          </Link>
        </div>

        {/* 갤러리 */}
        {generations.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-sm">아직 생성한 이미지가 없습니다.</p>
            <Link
              href="/generate"
              className="mt-4 inline-block text-sm font-medium text-black hover:underline"
            >
              첫 번째 이미지 만들기
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {generations.map((gen) => (
                <div key={gen.id} className="group relative bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                  {/* 이미지 영역 */}
                  <div className="aspect-square bg-gray-100 relative">
                    {gen.status === 'succeeded' && gen.image_url ? (
                      <Image
                        src={gen.image_url}
                        alt={gen.prompt}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : gen.status === 'processing' || gen.status === 'pending' ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-gray-400">생성 실패</span>
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="p-3">
                    <p className="text-xs text-gray-700 line-clamp-2">{gen.prompt}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(gen.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>

                  {/* 다운로드 버튼 (호버) */}
                  {gen.status === 'succeeded' && gen.image_url && (
                    <a
                      href={gen.image_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black text-white text-xs px-2 py-1 rounded-md transition-opacity"
                    >
                      저장
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/dashboard?page=${page - 1}`}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    이전
                  </Link>
                )}
                <span className="text-sm text-gray-500">
                  {page} / {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/dashboard?page=${page + 1}`}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    다음
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
