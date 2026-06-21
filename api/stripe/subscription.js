import { getSupabaseAdmin, requireAuth, sendError } from '../_lib/auth.js'

function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { user } = await requireAuth(req)
    const supabase = getSupabaseAdmin()
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, subscription_plan, stripe_customer_id')
      .eq('id', user.id)
      .single()

    res.status(200).json({
      status: profile?.subscription_status || 'free',
      plan: profile?.subscription_plan || 'free',
      hasCustomer: !!profile?.stripe_customer_id,
      stripeConfigured: isStripeConfigured(),
    })
  } catch (err) {
    sendError(res, err)
  }
}
