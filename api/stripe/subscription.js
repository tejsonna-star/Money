import { getSupabaseAdmin, requireAuth, sendError } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { user } = await requireAuth(req)
    const supabase = getSupabaseAdmin()
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_status, stripe_customer_id')
      .eq('id', user.id)
      .single()

    res.status(200).json({
      status: profile?.subscription_status || 'trialing',
      hasCustomer: !!profile?.stripe_customer_id,
    })
  } catch (err) {
    sendError(res, err)
  }
}
