import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (!session.metadata) {
      return NextResponse.json({ error: 'No metadata' }, { status: 400 })
    }

    const { user_id, credits } = session.metadata

    const supabase = createServiceClient()
    await supabase.rpc('add_credits', {
      p_user_id: user_id,
      p_amount: parseInt(credits),
      p_type: 'purchase',
      p_description: `크레딧 구매 (${credits}개)`,
      p_stripe_payment_intent_id: session.payment_intent as string,
    })
  }

  return NextResponse.json({ ok: true })
}
