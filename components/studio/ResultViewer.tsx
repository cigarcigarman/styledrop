'use client'

import Image from 'next/image'

type Status = 'idle' | 'loading' | 'pending' | 'done' | 'failed' | 'filtered'

interface ResultViewerProps {
  status: Status
  imageUrl: string | null
  error: string | null
  onReset: () => void
}

export function ResultViewer({ status, imageUrl, error, onReset }: ResultViewerProps) {
  if (status === 'idle') {
    return (
      <div className="aspect-square rounded-[var(--radius-card)] bg-[var(--surface)] flex items-center justify-center">
        <p className="text-[var(--text2)] text-sm">생성 결과가 여기에 표시됩니다</p>
      </div>
    )
  }

  if (status === 'loading' || status === 'pending') {
    return (
      <div className="aspect-square rounded-[var(--radius-card)] bg-[var(--surface)] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-[var(--border)] border-t-[var(--accent)] rounded-full animate-spin" />
        <p className="text-[var(--text2)] text-sm">
          {status === 'loading' ? '요청 중...' : '이미지 생성 중... (30~60초)'}
        </p>
      </div>
    )
  }

  if (status === 'done' && imageUrl) {
    return (
      <div className="flex flex-col gap-3">
        <div className="aspect-square rounded-[var(--radius-card)] overflow-hidden relative">
          <Image
            src={imageUrl}
            alt="생성된 이미지"
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex gap-2">
          <a
            href={imageUrl}
            download="styledrop.webp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-3 rounded-[var(--radius-btn)] bg-[var(--accent)] text-black text-sm font-semibold"
          >
            저장
          </a>
          <button
            type="button"
            onClick={onReset}
            className="flex-1 py-3 rounded-[var(--radius-btn)] bg-[var(--surface2)] text-[var(--text)] text-sm font-semibold border border-[var(--border)]"
          >
            다시 생성
          </button>
        </div>
      </div>
    )
  }

  // failed or filtered
  return (
    <div className="aspect-square rounded-[var(--radius-card)] bg-[var(--surface)] flex flex-col items-center justify-center gap-4 p-6">
      <p className="text-[var(--text2)] text-sm text-center">{error ?? '생성에 실패했습니다.'}</p>
      <button
        type="button"
        onClick={onReset}
        className="px-6 py-2.5 rounded-[var(--radius-btn)] bg-[var(--surface2)] text-[var(--text)] text-sm border border-[var(--border)]"
      >
        다시 시도
      </button>
    </div>
  )
}
