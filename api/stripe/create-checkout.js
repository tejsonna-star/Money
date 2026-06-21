import Stripe from 'stripe'
import { getSupabaseAdmin, requireAuth, getFrontendUrl, sendError } from '../_lib/auth.js'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) return null
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

function getPriceId(plan) {
  if (plan === 'plus') {
    return process.env.STRIPE_PRICE_ID_PLUS || process.env.STRIPE_PRICE_ID
  }
  if (plan === 'pro') {
    return process.env.STRIPE_PRICE_ID_PRO || process.env.STRIPE_PRICE_ID
  }
  return process.env.STRIPE_PRICE_ID
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return {}
}

async function getOrCreateCustomer(userId, email) {
  const supabase = getSupabaseAdmin()
  const stripe = getStripe()
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_customer_id) return profile.stripe_customer_id

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  })

  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = await readBody(req)
  const plan = body?.plan === 'plus' ? 'plus' : 'pro'

  const stripe = getStripe()
  if (!stripe) {
    return res.status(200).json({
      stripeConfigured: false,
      preview: true,
      plan,
      message: 'Stripe not configured yet. Add keys on Vercel to enable checkout.',
    })
  }

  try {
    const priceId = getPriceId(plan)
    if (!priceId) {
      return res.status(503).json({ error: 'Stripe price not configured for this plan' })
    }

    const { user } = await requireAuth(req)
    const customerId = await getOrCreateCustomer(user.id, user.email)
    const frontendUrl = getFrontendUrl()

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { supabase_user_id: user.id, plan },
      },
      success_url: `${frontendUrl}/dashboard/settings?success=true&plan=${plan}`,
      cancel_url: `${frontendUrl}/dashboard/settings?canceled=true`,
      metadata: { supabase_user_id: user.id, plan },
    })

    res.status(200).json({ url: session.url, plan, stripeConfigured: true })
  } catch (err) {
    console.error('Checkout error:', err.message)
    sendError(res, err)
  }
}
