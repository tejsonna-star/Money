import { createClient } from '@supabase/supabase-js'

export function getSupabaseAdmin() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY must be set on Vercel')
  }
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
}

export async function requireAuth(req) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    const err = new Error('Missing authorization token')
    err.status = 401
    throw err
  }

  const token = header.slice(7)
  const supabase = getSupabaseAdmin()
  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    const err = new Error('Invalid token')
    err.status = 401
    throw err
  }

  return { user, token }
}

export async function requireSubscription(user) {
  const supabase = getSupabaseAdmin()
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', user.id)
    .single()

  const allowed = ['active', 'trialing']
  if (!allowed.includes(profile?.subscription_status)) {
    const err = new Error('Active subscription required')
    err.status = 403
    throw err
  }
}

export function getFrontendUrl() {
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:5180'
}

export function sendError(res, err) {
  const status = err.status || 500
  res.status(status).json({ error: err.message || 'Server error' })
}

export async function readRawBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}
