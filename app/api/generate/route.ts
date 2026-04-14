import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createPrediction, checkBannedKeywords } from '@/lib/replicate'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const body = await request.json() as { artistId?: string; prompt?: string }
  const { artistId, prompt } = body

  if (!artistId || !prompt?.trim()) {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 })
  }

  if (prompt.length > 500) {
    return NextResponse.json({ error: 'PROMPT_TOO_LONG' }, { status: 400 })
  }

  const service = createServiceClient()

  // 크레딧 확인
  const { data: credit } = await service
    .from('credits')
    .select('amount')
    .eq('user_id', user.id)
    .single()

  if (!credit || credit.amount < 1) {
    return NextResponse.json(
      { error: 'INSUFFICIENT_CREDITS', current: credit?.amount ?? 0 },
      { status: 402 }
    )
  }

  // 작가 확인
  const { data: artist } = await service
    .from('artists')
    .select('id, replicate_model_version, trigger_word, banned_keywords, daily_limit')
    .eq('id', artistId)
    .eq('is_active', true)
    .single()

  if (!artist) {
    return NextResponse.json({ error: 'ARTIST_NOT_FOUND' }, { status: 404 })
  }

  // 일일 한도 확인
  const today = new Date().toISOString().split('T')[0]
  const { count: todayCount } = await service
    .from('generations')
    .select('id', { count: 'exact', head: true })
    .eq('artist_id', artistId)
    .gte('created_at', `${today}T00:00:00.000Z`)

  if ((todayCount ?? 0) >= artist.daily_limit) {
    return NextResponse.json({ error: 'DAILY_LIMIT_EXCEEDED' }, { status: 429 })
  }

  // 금지 키워드 체크
  const banned = checkBannedKeywords(prompt.trim(), artist.banned_keywords ?? [])
  if (banned) {
    return NextResponse.json({ error: 'BANNED_KEYWORD', keyword: banned }, { status: 400 })
  }

  // Replicate prediction 생성
  let prediction
  try {
    prediction = await createPrediction({
      modelVersion: artist.replicate_model_version,
      triggerWord: artist.trigger_word,
      userPrompt: prompt.trim(),
      bannedKeywords: artist.banned_keywords ?? [],
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.startsWith('BANNED_KEYWORD:')) {
      const kw = msg.replace('BANNED_KEYWORD:', '')
      return NextResponse.json({ error: 'BANNED_KEYWORD', keyword: kw }, { status: 400 })
    }
    console.error('[Replicate] prediction create error', err)
    return NextResponse.json({ error: 'REPLICATE_ERROR' }, { status: 500 })
  }

  // generations insert
  const { data: generation, error: insertError } = await service
    .from('generations')
    .insert({
      user_id: user.id,
      artist_id: artistId,
      prompt: prompt.trim(),
      replicate_prediction_id: prediction.id,
      status: 'pending',
      credits_used: 1,
    })
    .select('id')
    .single()

  if (insertError || !generation) {
    console.error('[DB] generation insert error', insertError)
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 })
  }

  // 크레딧 차감 (FOR UPDATE row lock)
  const { data: deducted } = await service.rpc('deduct_credit', { p_user_id: user.id })

  if (!deducted) {
    // 차감 실패 시 generation 삭제 후 에러 반환
    await service.from('generations').delete().eq('id', generation.id)
    return NextResponse.json({ error: 'INSUFFICIENT_CREDITS', current: 0 }, { status: 402 })
  }

  return NextResponse.json({
    generationId: generation.id,
    predictionId: prediction.id,
  })
}
