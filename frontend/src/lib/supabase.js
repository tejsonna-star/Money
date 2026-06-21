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

export const EXPENSE_CATEGORIES = [
  'Rent',
  'Food',
  'Transportation',
  'Subscriptions',
  'Utilities',
  'Insurance',
  'Entertainment',
  'Other',
]

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

export async function getTransactions(userId, limit) {
  try {
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
    if (limit) query = query.limit(limit)
    const { data, error } = await query
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function addTransaction(userId, transaction) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({ user_id: userId, ...transaction })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getGoals(userId) {
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function addGoal(userId, goal) {
  const { data, error } = await supabase
    .from('goals')
    .insert({ user_id: userId, ...goal })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateGoal(id, updates) {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteGoal(id) {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function getBudgetLimits(userId) {
  try {
    const { data, error } = await supabase
      .from('budget_limits')
      .select('*')
      .eq('user_id', userId)
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function upsertBudgetLimit(userId, category, monthlyLimit) {
  const { data, error } = await supabase
    .from('budget_limits')
    .upsert(
      { user_id: userId, category, monthly_limit: Number(monthlyLimit) },
      { onConflict: 'user_id,category' }
    )
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getNetWorthHistory(userId) {
  try {
    const { data, error } = await supabase
      .from('net_worth_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('recorded_at', { ascending: true })
      .limit(12)
    if (error) return []
    return data || []
  } catch {
    return []
  }
}

export async function recordNetWorthSnapshot(userId, netWorth) {
  const recordedAt = new Date().toISOString().slice(0, 10)
  const { error } = await supabase
    .from('net_worth_snapshots')
    .upsert(
      { user_id: userId, net_worth: Number(netWorth), recorded_at: recordedAt },
      { onConflict: 'user_id,recorded_at' }
    )
  if (error) console.warn('Net worth snapshot:', error.message)
}

function monthKey(dateStr) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function currentMonthKey() {
  return monthKey(new Date().toISOString())
}

export function getCategorySpendingData(transactions, expenses) {
  const map = {}

  const txExpenses = transactions.filter((t) => t.type === 'expense')
  if (txExpenses.length) {
    const month = currentMonthKey()
    txExpenses
      .filter((t) => monthKey(t.transaction_date) === month)
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount)
      })
  } else {
    expenses.forEach((e) => {
      if (Number(e.amount) > 0) {
        map[e.category] = (map[e.category] || 0) + Number(e.amount)
      }
    })
  }

  return Object.entries(map)
    .filter(([, value]) => value > 0)
    .map(([name, value]) => ({ name, value }))
}

export function getSpendingOverTime(transactions, months = 6) {
  const now = new Date()
  const buckets = []

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
      spending: 0,
      income: 0,
    })
  }

  transactions.forEach((t) => {
    const key = monthKey(t.transaction_date)
    const bucket = buckets.find((b) => b.key === key)
    if (!bucket) return
    if (t.type === 'expense') bucket.spending += Number(t.amount)
    if (t.type === 'income') bucket.income += Number(t.amount)
  })

  return buckets.map(({ label, spending, income }) => ({ label, spending, income }))
}

export function getCategoryUsageThisMonth(transactions, expenses, category) {
  const month = currentMonthKey()
  const txTotal = transactions
    .filter((t) => t.type === 'expense' && t.category === category && monthKey(t.transaction_date) === month)
    .reduce((s, t) => s + Number(t.amount), 0)

  if (transactions.some((t) => t.type === 'expense')) return txTotal

  const exp = expenses.find((e) => e.category === category)
  return exp ? Number(exp.amount) : 0
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

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateTime(date = new Date()) {
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
