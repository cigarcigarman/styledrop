'use server'

import { createClient } from '@/lib/supabase/server'
import { replicateClient } from '@/lib/replicate'
import type { GenerateInput } from '@/types/generation'

export async function generateImage(input: GenerateInput) {
  if (!input.prompt?.trim()) {
    return { error: '프롬프트를 입력해주세요.' }
  }
  if (input.prompt.length > 500) {
    return { error: '프롬프트는 500자 이하로 입력해주세요.' }
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  // 크레딧 확인
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credits < 1) {
    return { error: 'INSUFFICIENT_CREDITS' }
  }

  // generations 레코드 생성
  const { data: generation, error: insertError } = await supabase
    .from('generations')
    .insert({
      user_id: user.id,
      prompt: input.prompt.trim(),
      negative_prompt: input.negative_prompt ?? null,
      style_preset: input.style_preset ?? null,
      status: 'pending',
      width: input.width ?? 1024,
      height: input.height ?? 1024,
    })
    .select()
    .single()

  if (insertError || !generation) {
    return { error: '생성 요청에 실패했습니다.' }
  }

  // 크레딧 선차감
  const { data: deducted } = await supabase.rpc('deduct_credits', {
    p_user_id: user.id,
    p_amount: 1,
    p_generation_id: generation.id,
  })

  if (!deducted) {
    // 차감 실패 시 레코드 삭제
    await supabase.from('generations').delete().eq('id', generation.id)
    return { error: '크레딧이 부족합니다.' }
  }

  try {
    const prediction = await replicateClient.generate({
      prompt: input.prompt.trim(),
      stylePreset: input.style_preset,
      width: input.width ?? 1024,
      height: input.height ?? 1024,
    })

    await supabase
      .from('generations')
      .update({
        replicate_prediction_id: prediction.id,
        status: 'processing',
      })
      .eq('id', generation.id)

    return { generation_id: generation.id }
  } catch (err) {
    console.error('[Replicate error]', err)
    // Replicate 호출 실패 시 크레딧 환불
    await supabase.rpc('add_credits', {
      p_user_id: user.id,
      p_amount: 1,
      p_type: 'refund',
      p_description: 'Replicate 호출 실패 환불',
    })
    await supabase
      .from('generations')
      .update({ status: 'failed', error_message: 'Replicate API 호출 실패' })
      .eq('id', generation.id)

    return { error: 'AI 서비스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }
}

export async function pollGenerationStatus(generationId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: generation } = await supabase
    .from('generations')
    .select('id, status, image_url, replicate_url, error_message, replicate_prediction_id')
    .eq('id', generationId)
    .eq('user_id', user.id)
    .single()

  // processing 상태이고 Replicate prediction ID가 있으면 직접 상태 체크
  if (generation?.status === 'processing' && generation.replicate_prediction_id) {
    const res = await fetch(
      `https://api.replicate.com/v1/predictions/${generation.replicate_prediction_id}`,
      { headers: { Authorization: `Token ${process.env.REPLICATE_API_TOKEN}` }, cache: 'no-store' }
    )

    if (res.ok) {
      const prediction = await res.json()

      if (prediction.status === 'succeeded' && prediction.output?.[0]) {
        await supabase
          .from('generations')
          .update({
            status: 'succeeded',
            replicate_url: prediction.output[0],
            image_url: prediction.output[0],
            completed_at: new Date().toISOString(),
          })
          .eq('id', generationId)

        return { ...generation, status: 'succeeded' as const, image_url: prediction.output[0] }
      }

      if (prediction.status === 'failed') {
        await supabase.rpc('add_credits', {
          p_user_id: user.id,
          p_amount: 1,
          p_type: 'refund',
          p_description: '이미지 생성 실패 환불',
        })
        await supabase
          .from('generations')
          .update({ status: 'failed', error_message: prediction.error ?? '생성 실패' })
          .eq('id', generationId)

        return { ...generation, status: 'failed' as const }
      }
    }
  }

  return generation
}
