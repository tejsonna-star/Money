import Stripe from 'stripe'
import { getSupabaseAdmin, requireAuth, getFrontendUrl, sendError } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null
  if (!stripe) return res.status(503).json({ error: 'Stripe not configured' })

  try {
    const { user } = await requireAuth(req)
    const supabase = getSupabaseAdmin()
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: 'No billing account found' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getFrontendUrl()}/dashboard/subscription`,
    })

    res.status(200).json({ url: session.url })
  } catch (err) {
    sendError(res, err)
  }
}
