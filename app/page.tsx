import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { ArtistCard } from '@/components/artist/ArtistCard'
import { ArtistCardSkeleton } from '@/components/artist/ArtistCardSkeleton'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import type { Artist } from '@/types/database'

export const metadata: Metadata = {
  title: 'StyleDrop — 작가 화풍으로 AI 이미지 만들기',
}

type ArtistWithSamples = Artist & {
  artist_samples: { image_url: string; sort_order: number }[]
}

async function ArtistGrid() {
  const supabase = createClient()

  const { data } = await supabase
    .from('artists')
    .select('*, artist_samples(image_url, sort_order)')
    .eq('is_active', true)
    .order('sort_order')

  const artists = (data ?? []) as unknown as ArtistWithSamples[]

  if (artists.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[var(--text2)] text-sm">준비 중입니다</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {artists.map((artist) => (
        <ArtistCard
          key={artist.id}
          artist={artist}
          samples={artist.artist_samples}
        />
      ))}
    </div>
  )
}

export default function GalleryPage() {
  return (
    <>
      <Header />
      <main className="flex-1 pb-20">
        <Suspense
          fallback={
            <div className="grid grid-cols-2 gap-3 p-4">
              {[1, 2, 3, 4].map((i) => <ArtistCardSkeleton key={i} />)}
            </div>
          }
        >
          <ArtistGrid />
        </Suspense>
      </main>
      <BottomNav />
    </>
  )
}
