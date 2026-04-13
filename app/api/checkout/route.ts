import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { package_id } = await req.json()

  const { data: pkg } = await supabase
    .from('credit_packages')
    .select('*')
    .eq('id', package_id)
    .eq('is_active', true)
    .single()

  if (!pkg) {
    return NextResponse.json({ error: 'Package not found' }, { status: 404 })
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: `StyleDrop ${pkg.name} — 크레딧 ${pkg.credits}개`,
          },
          unit_amount: pkg.price_usd,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: {
      user_id: user.id,
      package_id: pkg.id,
      credits: pkg.credits.toString(),
    },
  })

  return NextResponse.json({ checkout_url: session.url })
}
