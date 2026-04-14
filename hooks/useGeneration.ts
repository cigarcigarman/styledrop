'use client'

import { useState, useRef, useCallback } from 'react'

type GenerationStatus = 'idle' | 'loading' | 'pending' | 'done' | 'failed' | 'filtered'

interface GenerationState {
  status: GenerationStatus
  imageUrl: string | null
  error: string | null
  generationId: string | null
  predictionId: string | null
}

const POLL_INTERVAL = 3000
const MAX_POLL_MS = 120_000

export function useGeneration() {
  const [state, setState] = useState<GenerationState>({
    status: 'idle',
    imageUrl: null,
    error: null,
    generationId: null,
    predictionId: null,
  })

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startedAt = useRef<number>(0)

  const stopPolling = useCallback(() => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current)
      pollTimer.current = null
    }
  }, [])

  const poll = useCallback(async (predictionId: string) => {
    if (Date.now() - startedAt.current > MAX_POLL_MS) {
      stopPolling()
      setState((s) => ({ ...s, status: 'failed', error: '생성 시간이 초과됐습니다.' }))
      return
    }

    try {
      const res = await fetch(`/api/generate/${predictionId}`)
      const data = await res.json() as {
        status: string
        imageUrl?: string
        reason?: string
      }

      if (data.status === 'done' && data.imageUrl) {
        stopPolling()
        setState((s) => ({ ...s, status: 'done', imageUrl: data.imageUrl ?? null }))
        return
      }

      if (data.status === 'failed') {
        stopPolling()
        setState((s) => ({ ...s, status: 'failed', error: '생성에 실패했습니다. 크레딧이 환불됐습니다.' }))
        return
      }

      if (data.status === 'filtered') {
        stopPolling()
        setState((s) => ({ ...s, status: 'filtered', error: '콘텐츠 정책에 의해 차단됐습니다. 크레딧이 환불됐습니다.' }))
        return
      }

      // 아직 pending — 다시 폴링
      pollTimer.current = setTimeout(() => poll(predictionId), POLL_INTERVAL)
    } catch {
      pollTimer.current = setTimeout(() => poll(predictionId), POLL_INTERVAL)
    }
  }, [stopPolling])

  const generate = useCallback(async (artistId: string, prompt: string) => {
    stopPolling()
    setState({ status: 'loading', imageUrl: null, error: null, generationId: null, predictionId: null })

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId, prompt }),
      })

      const data = await res.json() as {
        generationId?: string
        predictionId?: string
        error?: string
        current?: number
        keyword?: string
      }

      if (!res.ok) {
        let msg = '생성에 실패했습니다.'
        if (data.error === 'INSUFFICIENT_CREDITS') msg = '크레딧이 부족합니다.'
        else if (data.error === 'BANNED_KEYWORD') msg = `금지된 키워드가 포함됐습니다: ${data.keyword}`
        else if (data.error === 'DAILY_LIMIT_EXCEEDED') msg = '오늘의 생성 한도에 도달했습니다.'
        else if (data.error === 'UNAUTHORIZED') msg = '로그인이 필요합니다.'

        setState((s) => ({ ...s, status: 'failed', error: msg }))
        return { error: data.error }
      }

      if (!data.predictionId || !data.generationId) {
        setState((s) => ({ ...s, status: 'failed', error: '서버 오류가 발생했습니다.' }))
        return { error: 'SERVER_ERROR' }
      }

      setState((s) => ({
        ...s,
        status: 'pending',
        generationId: data.generationId ?? null,
        predictionId: data.predictionId ?? null,
      }))

      startedAt.current = Date.now()
      pollTimer.current = setTimeout(() => poll(data.predictionId!), POLL_INTERVAL)
      return {}
    } catch {
      setState((s) => ({ ...s, status: 'failed', error: '네트워크 오류가 발생했습니다.' }))
      return { error: 'NETWORK_ERROR' }
    }
  }, [poll, stopPolling])

  const reset = useCallback(() => {
    stopPolling()
    setState({ status: 'idle', imageUrl: null, error: null, generationId: null, predictionId: null })
  }, [stopPolling])

  return { ...state, generate, reset }
}
