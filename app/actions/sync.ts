'use server'

import { createClient } from '@/lib/supabase/server'

export async function syncProcessingGenerations() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // 처리 중인 모든 generation 조회
  const { data: processing } = await supabase
    .from('generations')
    .select('id, replicate_prediction_id')
    .eq('user_id', user.id)
    .in('status', ['pending', 'processing'])
    .not('replicate_prediction_id', 'is', null)

  if (!processing || processing.length === 0) return

  // 각 generation의 Replicate 상태 확인
  await Promise.all(
    processing.map(async (gen) => {
      try {
        const res = await fetch(
          `https://api.replicate.com/v1/predictions/${gen.replicate_prediction_id}`,
          {
            headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` },
            cache: 'no-store',
          }
        )
        if (!res.ok) return

        const prediction = await res.json()

        if (prediction.status === 'succeeded' && prediction.output?.[0]) {
          await supabase
            .from('generations')
            .update({
              status: 'succeeded',
              image_url: prediction.output[0],
              replicate_url: prediction.output[0],
              completed_at: new Date().toISOString(),
            })
            .eq('id', gen.id)
        } else if (prediction.status === 'failed' || prediction.status === 'canceled') {
          // 크레딧 환불
          await supabase.rpc('add_credits', {
            p_user_id: user.id,
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
            .eq('id', gen.id)
        }
      } catch {
        // 개별 prediction 오류는 무시
      }
    })
  )
}
