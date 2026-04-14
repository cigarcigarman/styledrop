import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { StudioClient } from '@/components/studio/StudioClient'
import type { Metadata } from 'next'
import type { Artist } from '@/types/database'

export const metadata: Metadata = { title: '만들기 — StyleDrop' }

export default async function StudioPage({
  searchParams,
}: {
  searchParams: { artistId?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?next=/studio${searchParams.artistId ? `?artistId=${searchParams.artistId}` : ''}`)
  }

  const [artistsRes, creditRes] = await Promise.all([
    supabase
      .from('artists')
      .select('id, name, twitter_handle, avatar_url, trigger_word, banned_keywords, daily_limit, replicate_model_version')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('credits')
      .select('amount')
      .eq('user_id', user.id)
      .single(),
  ])

  const artists = (artistsRes.data ?? []) as Artist[]
  const credits = creditRes.data?.amount ?? 0
  const initialArtistId = searchParams.artistId ?? artists[0]?.id ?? null

  return (
    <>
      <Header title="만들기" />
      <main className="flex-1 pb-20">
        <StudioClient
          artists={artists}
          initialArtistId={initialArtistId}
          credits={credits}
        />
      </main>
      <BottomNav />
    </>
  )
}
