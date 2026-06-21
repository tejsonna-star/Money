import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey)

export function getSupabaseConfigError() {
  if (isSupabaseConfigured()) return null
  return 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel → Settings → Environment Variables, then redeploy.'
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (error) return null
    return data
  } catch {
    return null
  }
}

export async function getDebts(userId) {
  try {
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function getExpenses(userId) {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export function monthlyIncome(salary, payFrequency) {
  if (!salary) return 0
  switch (payFrequency) {
    case 'weekly': return salary * 52 / 12
    case 'biweekly': return salary * 26 / 12
    case 'monthly': return salary
    case 'annual': return salary / 12
    default: return salary / 12
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export function formatPercent(value) {
  return `${(value || 0).toFixed(1)}%`
}
