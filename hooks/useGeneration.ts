'use client'

import { useEffect, useRef, useState } from 'react'
import { pollGenerationStatus } from '@/app/actions/generate'

interface GenerationResult {
  id: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed'
  image_url: string | null
  error_message: string | null
}

export function useGeneration(generationId: string | null) {
  const [generation, setGeneration] = useState<GenerationResult | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!generationId) return

    function stopPolling() {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    async function poll() {
      const data = await pollGenerationStatus(generationId!)
      if (!data) return

      const result: GenerationResult = {
        id: data.id,
        status: data.status as GenerationResult['status'],
        image_url: data.image_url ?? null,
        error_message: data.error_message ?? null,
      }

      setGeneration(result)

      if (result.status === 'succeeded' || result.status === 'failed') {
        stopPolling()
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 2000)

    return stopPolling
  }, [generationId])

  return generation
}
