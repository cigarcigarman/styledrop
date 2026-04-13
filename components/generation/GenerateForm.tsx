'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { generateImage } from '@/app/actions/generate'
import { useGeneration } from '@/hooks/useGeneration'
import type { StylePreset } from '@/types/database'
import Image from 'next/image'

const STYLE_PRESETS: { value: StylePreset; label: string }[] = [
  { value: 'casual', label: '캐주얼' },
  { value: 'formal', label: '포멀' },
  { value: 'streetwear', label: '스트릿' },
  { value: 'vintage', label: '빈티지' },
  { value: 'minimal', label: '미니멀' },
]

interface GenerateFormProps {
  credits: number
}

export function GenerateForm({ credits }: GenerateFormProps) {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [selectedStyle, setSelectedStyle] = useState<StylePreset | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const generation = useGeneration(generationId)
  const isGenerating = isPending || (generationId !== null && generation?.status !== 'succeeded' && generation?.status !== 'failed')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim() || isGenerating) return
    setError(null)
    setGenerationId(null)

    startTransition(async () => {
      const result = await generateImage({
        prompt,
        style_preset: selectedStyle ?? undefined,
      })

      if ('error' in result) {
        if (result.error === 'INSUFFICIENT_CREDITS') {
          router.push('/pricing')
          return
        }
        setError(result.error ?? '알 수 없는 오류가 발생했습니다.')
        return
      }

      setGenerationId(result.generation_id)
    })
  }

  function handleReset() {
    setGenerationId(null)
    setError(null)
    setPrompt('')
    setSelectedStyle(null)
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 크레딧 표시 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">이미지 생성</h2>
        <span className="text-sm text-gray-500">
          남은 크레딧: <span className="font-semibold text-black">{credits}개</span>
        </span>
      </div>

      {/* 결과 표시 */}
      {generation?.status === 'succeeded' && generation.image_url && (
        <div className="mb-8">
          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={generation.image_url}
              alt={prompt}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="mt-3 flex gap-3">
            <a
              href={generation.image_url}
              download="styledrop.webp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              다운로드
            </a>
            <button
              onClick={handleReset}
              className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              새로 만들기
            </button>
          </div>
        </div>
      )}

      {/* 생성 중 */}
      {isGenerating && generation?.status !== 'succeeded' && (
        <div className="mb-8 aspect-square w-full rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">이미지 생성 중... (약 10-30초)</p>
        </div>
      )}

      {/* 실패 */}
      {generation?.status === 'failed' && (
        <div className="mb-8 p-4 bg-red-50 rounded-xl text-center">
          <p className="text-sm text-red-600">{generation.error_message ?? '생성에 실패했습니다. 크레딧이 환불되었습니다.'}</p>
          <button onClick={handleReset} className="mt-3 text-sm font-medium text-black hover:underline">
            다시 시도
          </button>
        </div>
      )}

      {/* 폼 */}
      {!isGenerating && generation?.status !== 'succeeded' && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 스타일 프리셋 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">스타일</label>
            <div className="flex gap-2 flex-wrap">
              {STYLE_PRESETS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedStyle(selectedStyle === value ? null : value)}
                  className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                    selectedStyle === value
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-gray-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 프롬프트 */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
              스타일 설명
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={500}
              rows={4}
              placeholder="예: 흰 린넨 셔츠에 와이드 베이지 팬츠, 갈색 로퍼, 미니멀한 여름 룩"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-400 text-right">{prompt.length}/500</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={!prompt.trim() || credits < 1}
            className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {credits < 1 ? '크레딧 부족 — 충전하기' : '생성하기 (크레딧 1개)'}
          </button>
        </form>
      )}
    </div>
  )
}
