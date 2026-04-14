import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { signOut } from '@/app/actions/auth'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '내 계정 — StyleDrop' }

const PAGE_SIZE = 16

export default async function MyPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/my')

  const page = Math.max(1, parseInt(searchParams.page ?? '1'))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const [profileRes, creditRes, generationsRes] = await Promise.all([
    supabase.from('profiles').select('nickname, avatar_url').eq('id', user.id).single(),
    supabase.from('credits').select('amount').eq('user_id', user.id).single(),
    supabase
      .from('generations')
      .select('id, prompt, status, result_url, created_at', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to),
  ])

  const profile = profileRes.data
  const credits = creditRes.data?.amount ?? 0
  const generations = generationsRes.data ?? []
  const totalCount = generationsRes.count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const displayName = profile?.nickname ?? user.email?.split('@')[0] ?? '사용자'

  return (
    <>
      <Header title="내 계정" />
      <main className="flex-1 pb-20">
        {/* 프로필 */}
        <div className="p-4 flex items-center gap-3 border-b border-[var(--border)]">
          <div className="w-12 h-12 rounded-full bg-[var(--surface2)] overflow-hidden flex-shrink-0">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt={displayName} width={48} height={48} className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--text2)] text-lg font-bold">
                {displayName[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text)] truncate">{displayName}</p>
            <p className="text-xs text-[var(--text2)]">{user.email}</p>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-xs text-[var(--text2)] border border-[var(--border)] px-3 py-1.5 rounded-full">
              로그아웃
            </button>
          </form>
        </div>

        {/* 크레딧 */}
        <div className="p-4 flex items-center justify-between border-b border-[var(--border)]">
          <div>
            <p className="text-xs text-[var(--text2)]">잔여 크레딧</p>
            <p className="text-2xl font-bold text-[var(--accent)]">{credits}개</p>
          </div>
          <Link
            href="/charge"
            className="px-4 py-2 rounded-[var(--radius-btn)] bg-[var(--accent)] text-black text-sm font-semibold"
          >
            충전하기
          </Link>
        </div>

        {/* 생성 기록 */}
        <div className="p-4">
          <p className="text-xs text-[var(--text2)] mb-3">생성 기록 {totalCount > 0 ? `(${totalCount})` : ''}</p>

          {generations.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-[var(--text2)]">아직 생성한 이미지가 없어요</p>
              <Link href="/studio" className="mt-3 inline-block text-sm text-[var(--accent)]">
                첫 이미지 만들기 →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-1.5">
                {generations.map((gen) => (
                  <div key={gen.id} className="aspect-square bg-[var(--surface)] rounded-lg overflow-hidden relative">
                    {gen.status === 'done' && gen.result_url ? (
                      <a href={gen.result_url} target="_blank" rel="noopener noreferrer">
                        <Image
                          src={gen.result_url}
                          alt={gen.prompt}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </a>
                    ) : gen.status === 'pending' ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] text-[var(--text2)]">실패</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  {page > 1 && (
                    <Link href={`/my?page=${page - 1}`} className="text-xs text-[var(--text2)] px-3 py-1.5 border border-[var(--border)] rounded-full">
                      이전
                    </Link>
                  )}
                  <span className="text-xs text-[var(--text2)]">{page} / {totalPages}</span>
                  {page < totalPages && (
                    <Link href={`/my?page=${page + 1}`} className="text-xs text-[var(--text2)] px-3 py-1.5 border border-[var(--border)] rounded-full">
                      다음
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <BottomNav />
    </>
  )
}
