'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ResultViewer } from './ResultViewer'
import { useGeneration } from '@/hooks/useGeneration'
import type { Artist } from '@/types/database'

const EXAMPLE_PROMPTS = [
  '봄 소풍 가는 캐릭터, 꽃밭 배경',
  '귀여운 고양이 귀를 가진 캐릭터',
  '밤하늘 아래 별을 보는 장면',
]

interface StudioClientProps {
  artists: Artist[]
  initialArtistId: string | null
  credits: number
}

export function StudioClient({ artists, initialArtistId, credits: initialCredits }: StudioClientProps) {
  const router = useRouter()
  const [selectedArtistId, setSelectedArtistId] = useState<string>(initialArtistId ?? '')
  const [prompt, setPrompt] = useState('')
  const [credits, setCredits] = useState(initialCredits)
  const { status, imageUrl, error, generate, reset } = useGeneration()

  const isGenerating = status === 'loading' || status === 'pending'
  const selectedArtist = artists.find((a) => a.id === selectedArtistId)

  async function handleGenerate() {
    if (!selectedArtistId || !prompt.trim()) return
    if (credits < 1) {
      router.push('/charge')
      return
    }

    const result = await generate(selectedArtistId, prompt.trim())

    if (!result.error) {
      setCredits((c) => c - 1)
    }

    if (result.error === 'INSUFFICIENT_CREDITS') {
      router.push('/charge')
    }
    if (result.error === 'UNAUTHORIZED') {
      router.push('/login?next=/studio')
    }
  }

  return (
    <div className="p-4 flex flex-col gap-5">
      {/* 크레딧 잔액 */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text2)]">잔여 크레딧</span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text)]">{credits}개</span>
          <button
            type="button"
            onClick={() => router.push('/charge')}
            className="text-xs px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--text2)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
          >
            충전
          </button>
        </div>
      </div>

      {/* 작가 선택 */}
      <div>
        <p className="text-xs text-[var(--text2)] mb-2">화풍 선택</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {artists.map((artist) => (
            <button
              key={artist.id}
              type="button"
              onClick={() => setSelectedArtistId(artist.id)}
              className={[
                'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors',
                selectedArtistId === artist.id
                  ? 'bg-[var(--accent)] text-black border-[var(--accent)]'
                  : 'bg-transparent text-[var(--text2)] border-[var(--border)]',
              ].join(' ')}
            >
              {artist.name}
            </button>
          ))}
        </div>
      </div>

      {/* 프롬프트 입력 */}
      <div>
        <p className="text-xs text-[var(--text2)] mb-2">프롬프트</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            selectedArtist
              ? `${selectedArtist.name} 화풍으로 만들고 싶은 장면을 설명해주세요`
              : '화풍을 먼저 선택해주세요'
          }
          maxLength={500}
          rows={4}
          disabled={isGenerating}
          className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-card)] p-3 text-sm text-[var(--text)] placeholder-[var(--text2)] resize-none focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
        />
        <div className="mt-1 flex justify-between">
          <div className="flex gap-1.5 flex-wrap">
            {EXAMPLE_PROMPTS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setPrompt(ex)}
                disabled={isGenerating}
                className="text-xs px-2 py-1 rounded-full bg-[var(--surface2)] text-[var(--text2)] border border-[var(--border)] disabled:opacity-50"
              >
                {ex.length > 12 ? ex.slice(0, 12) + '…' : ex}
              </button>
            ))}
          </div>
          <span className="text-xs text-[var(--text2)]">{prompt.length}/500</span>
        </div>
      </div>

      {/* 생성 버튼 */}
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating || !selectedArtistId || !prompt.trim()}
        className="w-full py-3.5 rounded-[var(--radius-btn)] bg-[var(--accent)] text-black font-semibold text-sm disabled:opacity-40 transition-opacity"
      >
        {isGenerating ? '생성 중...' : credits < 1 ? '크레딧 충전하기' : '생성하기 (1크레딧)'}
      </button>

      {/* 결과 */}
      <ResultViewer
        status={status}
        imageUrl={imageUrl}
        error={error}
        onReset={reset}
      />
    </div>
  )
}
