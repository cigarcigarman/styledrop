import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getPrediction } from '@/lib/replicate'

export async function GET(
  _request: NextRequest,
  { params }: { params: { predictionId: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const { predictionId } = params
  const service = createServiceClient()

  // generation 조회 (본인 소유 확인)
  const { data: generation } = await service
    .from('generations')
    .select('id, status, result_url')
    .eq('replicate_prediction_id', predictionId)
    .eq('user_id', user.id)
    .single()

  if (!generation) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  // 이미 종료 상태면 바로 반환
  if (generation.status === 'done') {
    return NextResponse.json({ status: 'done', imageUrl: generation.result_url })
  }
  if (generation.status === 'failed') {
    return NextResponse.json({ status: 'failed' })
  }
  if (generation.status === 'filtered') {
    return NextResponse.json({ status: 'filtered', reason: 'NSFW_DETECTED' })
  }

  // Replicate 상태 조회
  let prediction
  try {
    prediction = await getPrediction(predictionId)
  } catch (err) {
    console.error('[Replicate] get prediction error', err)
    return NextResponse.json({ status: 'pending' })
  }

  if (prediction.status === 'starting' || prediction.status === 'processing') {
    return NextResponse.json({ status: 'pending' })
  }

  if (prediction.status === 'failed' || prediction.error) {
    await Promise.all([
      service.from('generations').update({ status: 'failed' }).eq('id', generation.id),
      refundCredit(service, user.id),
    ])
    return NextResponse.json({ status: 'failed' })
  }

  if (prediction.status === 'succeeded' && Array.isArray(prediction.output) && prediction.output[0]) {
    const replicateUrl = prediction.output[0] as string

    const storedUrl = await uploadToStorage(service, user.id, generation.id, replicateUrl)
    const finalUrl = storedUrl ?? replicateUrl

    await service
      .from('generations')
      .update({ status: 'done', result_url: finalUrl })
      .eq('id', generation.id)

    return NextResponse.json({ status: 'done', imageUrl: finalUrl })
  }

  return NextResponse.json({ status: 'pending' })
}

async function refundCredit(
  service: ReturnType<typeof import('@/lib/supabase/service').createServiceClient>,
  userId: string
) {
  // amount + 1 (Postgres arithmetic via RPC 대신 직접 처리)
  const { data } = await service
    .from('credits')
    .select('amount')
    .eq('user_id', userId)
    .single()

  if (data) {
    await service
      .from('credits')
      .update({ amount: data.amount + 1, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
  }
}

async function uploadToStorage(
  service: ReturnType<typeof import('@/lib/supabase/service').createServiceClient>,
  userId: string,
  generationId: string,
  imageUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl)
    if (!res.ok) return null

    const buffer = await res.arrayBuffer()
    const path = `${userId}/${generationId}.webp`

    const { error } = await service.storage
      .from('generations')
      .upload(path, buffer, { contentType: 'image/webp', upsert: false })

    if (error) {
      console.error('[Storage] upload error', error)
      return null
    }

    const { data } = service.storage.from('generations').getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    console.error('[Storage] upload unexpected error', err)
    return null
  }
}
