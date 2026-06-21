const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' })
  }

  const token = header.slice(7)
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    return res.status(401).json({ error: 'Invalid token' })
  }

  req.user = user
  req.token = token
  next()
}

async function subscriptionMiddleware(req, res, next) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', req.user.id)
    .single()

  const allowed = ['active', 'trialing']
  if (!allowed.includes(profile?.subscription_status)) {
    return res.status(403).json({ error: 'Active subscription required' })
  }

  next()
}

module.exports = { authMiddleware, subscriptionMiddleware, supabase }
