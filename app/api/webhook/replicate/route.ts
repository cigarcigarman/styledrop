import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { ReplicatePrediction } from '@/types/generation'

export async function POST(req: NextRequest) {
  const prediction = await req.json() as ReplicatePrediction

  const supabase = createServiceClient()

  const { data: generation } = await supabase
    .from('generations')
    .select('id, user_id')
    .eq('replicate_prediction_id', prediction.id)
    .single()

  if (!generation) return NextResponse.json({ ok: true })

  if (prediction.status === 'succeeded' && prediction.output?.[0]) {
    await supabase
      .from('generations')
      .update({
        status: 'succeeded',
        image_url: prediction.output[0],
        replicate_url: prediction.output[0],
        completed_at: new Date().toISOString(),
      })
      .eq('id', generation.id)
  } else if (prediction.status === 'failed') {
    await supabase.rpc('add_credits', {
      p_user_id: generation.user_id,
      p_amount: 1,
      p_type: 'refund',
      p_description: '이미지 생성 실패 환불',
    })
    await supabase
      .from('generations')
      .update({
        status: 'failed',
        error_message: prediction.error ?? '생성 실패',
      })
      .eq('id', generation.id)
  }

  return NextResponse.json({ ok: true })
}
