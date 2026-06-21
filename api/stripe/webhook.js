import Stripe from 'stripe'
import { getSupabaseAdmin, readRawBody } from '../_lib/auth.js'

export const config = {
  api: { bodyParser: false },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null
  if (!stripe) return res.status(503).send('Stripe not configured')

  const sig = req.headers['stripe-signature']
  let event

  try {
    const rawBody = await readRawBody(req)
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const subscription = event.data.object
  const supabase = getSupabaseAdmin()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const userId = subscription.metadata?.supabase_user_id
      const plan = subscription.metadata?.plan || 'pro'
      if (userId) {
        await supabase
          .from('profiles')
          .update({
            subscription_status: subscription.status,
            subscription_plan: ['active', 'trialing'].includes(subscription.status) ? plan : 'free',
          })
          .eq('id', userId)
      }
      break
    }
    case 'customer.subscription.deleted': {
      const userId = subscription.metadata?.supabase_user_id
      if (userId) {
        await supabase
          .from('profiles')
          .update({ subscription_status: 'canceled', subscription_plan: 'free' })
          .eq('id', userId)
      }
      break
    }
  }

  res.status(200).json({ received: true })
}
