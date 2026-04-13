'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { syncProcessingGenerations } from '@/app/actions/sync'

interface DashboardPollerProps {
  hasProcessing: boolean
}

export function DashboardPoller({ hasProcessing }: DashboardPollerProps) {
  const router = useRouter()

  useEffect(() => {
    if (!hasProcessing) return

    async function poll() {
      await syncProcessingGenerations()
      router.refresh()
    }

    poll()
    const interval = setInterval(poll, 3000)
    return () => clearInterval(interval)
  }, [hasProcessing, router])

  return null
}
