import Link from 'next/link'
import Image from 'next/image'
import type { Artist } from '@/types/database'

interface ArtistCardProps {
  artist: Artist
  samples: { image_url: string; sort_order: number }[]
}

export function ArtistCard({ artist, samples }: ArtistCardProps) {
  const sorted = [...samples].sort((a, b) => a.sort_order - b.sort_order).slice(0, 4)

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-card)] overflow-hidden">
      {/* 샘플 이미지 2×2 그리드 */}
      <div className="grid grid-cols-2 gap-0.5 bg-[var(--border)]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-square bg-[var(--surface2)] relative">
            {sorted[i] ? (
              <Image
                src={sorted[i].image_url}
                alt={`${artist.name} 샘플 ${i + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* 작가 정보 */}
      <div className="p-3 flex flex-col gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--text)]">{artist.name}</p>
          {artist.twitter_handle && (
            <p className="text-xs text-[var(--text2)]">@{artist.twitter_handle}</p>
          )}
          {artist.bio && (
            <p className="text-xs text-[var(--text2)] mt-1 line-clamp-2">{artist.bio}</p>
          )}
        </div>
        <Link
          href={`/studio?artistId=${artist.id}`}
          className="block w-full text-center text-xs font-semibold py-2 rounded-[var(--radius-btn)] bg-[var(--accent)] text-black"
        >
          이 화풍으로 만들기
        </Link>
      </div>
    </div>
  )
}
