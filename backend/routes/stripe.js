const express = require('express')
const Stripe = require('stripe')
const { authMiddleware, supabase } = require('../middleware/auth')

const router = express.Router()
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const PRICE_ID = process.env.STRIPE_PRICE_ID
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

async function getOrCreateCustomer(userId, email) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id
  }

  const customer = await stripe.customers.create({ email, metadata: { supabase_user_id: userId } })
  await supabase
    .from('profiles')
    .update({ stripe_customer_id: customer.id })
    .eq('id', userId)

  return customer.id
}

router.post('/create-checkout', authMiddleware, async (req, res) => {
  if (!stripe || !PRICE_ID) {
    return res.status(503).json({ error: 'Stripe not configured' })
  }

  try {
    const customerId = await getOrCreateCustomer(req.user.id, req.user.email)

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      success_url: `${FRONTEND_URL}/dashboard/settings?success=true`,
      cancel_url: `${FRONTEND_URL}/dashboard/settings?canceled=true`,
      metadata: { supabase_user_id: req.user.id },
    })

    res.json({ url: session.url })
  } catch (err) {
    console.error('Checkout error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

router.post('/create-portal', authMiddleware, async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe not configured' })
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', req.user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${FRONTEND_URL}/dashboard/settings`,
    })

    res.json({ url: session.url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/subscription', authMiddleware, async (req, res) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, stripe_customer_id')
    .eq('id', req.user.id)
    .single()

  res.json({
    status: profile?.subscription_status || 'trialing',
    hasCustomer: !!profile?.stripe_customer_id,
  })
})

router.post('/webhook', async (req, res) => {
  if (!stripe) return res.status(503).send('Stripe not configured')

  const sig = req.headers['stripe-signature']
  let event

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const subscription = event.data.object

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const userId = subscription.metadata?.supabase_user_id
      if (userId) {
        await supabase
          .from('profiles')
          .update({ subscription_status: subscription.status })
          .eq('id', userId)
      }
      break
    }
    case 'customer.subscription.deleted': {
      const userId = subscription.metadata?.supabase_user_id
      if (userId) {
        await supabase
          .from('profiles')
          .update({ subscription_status: 'canceled' })
          .eq('id', userId)
      }
      break
    }
  }

  res.json({ received: true })
})

module.exports = router
