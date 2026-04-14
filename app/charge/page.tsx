import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { ChargeClient } from '@/components/pricing/ChargeClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: '크레딧 충전 — StyleDrop' }

export default async function ChargePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?next=/charge')

  const { data: credit } = await supabase
    .from('credits')
    .select('amount')
    .eq('user_id', user.id)
    .single()

  return (
    <>
      <Header title="크레딧 충전" showBack backHref="/studio" />
      <main className="flex-1 p-4">
        <ChargeClient
          currentCredits={credit?.amount ?? 0}
          clientKey={process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? ''}
        />
      </main>
    </>
  )
}
