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

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
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

// --- Accounts ---
export async function getAccounts(userId) {
  try {
    const { data, error } = await supabase.from('accounts').select('*').eq('user_id', userId).order('created_at')
    if (error) return []
    return data || []
  } catch { return [] }
}

export async function addAccount(userId, account) {
  const { data, error } = await supabase.from('accounts').insert({ user_id: userId, ...account }).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateAccount(id, updates) {
  const { data, error } = await supabase.from('accounts').update(updates).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteAccount(id) {
  const { error } = await supabase.from('accounts').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// --- Side income ---
export async function getSideIncome(userId) {
  try {
    const { data, error } = await supabase.from('side_income').select('*').eq('user_id', userId).order('recorded_date', { ascending: false })
    if (error) return []
    return data || []
  } catch { return [] }
}

export async function addSideIncome(userId, entry) {
  const { data, error } = await supabase.from('side_income').insert({ user_id: userId, ...entry }).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteSideIncome(id) {
  const { error } = await supabase.from('side_income').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

// --- Gamification ---
export async function getGamification(userId) {
  try {
    const { data, error } = await supabase.from('user_gamification').select('*').eq('user_id', userId).maybeSingle()
    if (error) return null
    return data
  } catch { return null }
}

export async function upsertGamification(userId, updates) {
  const { data, error } = await supabase.from('user_gamification').upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() }).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function recordActivity(userId) {
  const today = new Date().toISOString().slice(0, 10)
  const g = await getGamification(userId)
  const last = g?.last_activity_date
  let streak = g?.streak_days || 0
  if (last !== today) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yStr = yesterday.toISOString().slice(0, 10)
    streak = last === yStr ? streak + 1 : 1
    await upsertGamification(userId, { streak_days: streak, last_activity_date: today })
  }
  return streak
}

// --- Recurring transactions ---
export async function processRecurringTransactions(userId) {
  const { data: templates } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_recurring', true)
    .is('parent_id', null)

  if (!templates?.length) return

  const today = new Date()
  for (const tpl of templates) {
    const freq = tpl.recurring_frequency || 'monthly'
    const last = tpl.last_recurred_at || tpl.transaction_date
    const lastDate = new Date(last)
    let due = false
    if (freq === 'weekly') {
      due = (today - lastDate) / 86400000 >= 7
    } else {
      due = today.getMonth() !== lastDate.getMonth() || today.getFullYear() !== lastDate.getFullYear()
    }
    if (!due) continue

    await supabase.from('transactions').insert({
      user_id: userId,
      amount: tpl.amount,
      category: tpl.category,
      type: tpl.type,
      transaction_date: today.toISOString().slice(0, 10),
      note: tpl.note ? `${tpl.note} (recurring)` : 'Recurring',
      account_id: tpl.account_id,
    })
    await supabase.from('transactions').update({ last_recurred_at: today.toISOString().slice(0, 10) }).eq('id', tpl.id)
  }
}

export async function addTransactionWithSplits(userId, parent, splits) {
  const { data: parentTx, error } = await supabase.from('transactions').insert({ user_id: userId, ...parent }).select().single()
  if (error) throw new Error(error.message)
  if (splits?.length) {
    const children = splits.map((s) => ({
      user_id: userId,
      amount: Number(s.amount),
      category: s.category,
      type: parent.type,
      transaction_date: parent.transaction_date,
      parent_id: parentTx.id,
      note: s.note || null,
    }))
    await supabase.from('transactions').insert(children)
  }
  return parentTx
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteUserData(userId) {
  const { error } = await supabase.from('profiles').delete().eq('id', userId)
  if (error) throw new Error(error.message)
  await supabase.auth.signOut()
}

export async function applyBudgetRolloverForMonth(userId, limits, categorySpending) {
  const updates = limits.map((l) => {
    const spent = categorySpending[l.category] || 0
    const effective = Number(l.monthly_limit) + Number(l.rollover_balance || 0)
    const remaining = Math.max(0, effective - spent)
    return upsertBudgetLimitWithRollover(userId, l.category, l.monthly_limit, remaining)
  })
  await Promise.all(updates)
}

async function upsertBudgetLimitWithRollover(userId, category, monthlyLimit, rolloverBalance) {
  return supabase.from('budget_limits').upsert(
    { user_id: userId, category, monthly_limit: Number(monthlyLimit), rollover_balance: Number(rolloverBalance) },
    { onConflict: 'user_id,category' }
  )
}

export async function saveBudgetSnapshot(userId, category, monthKey, spent, limitAmount, rolloverIn) {
  await supabase.from('budget_monthly_snapshots').upsert({
    user_id: userId, category, month_key: monthKey, spent, limit_amount: limitAmount, rollover_in: rolloverIn,
  }, { onConflict: 'user_id,category,month_key' })
}

export async function getBudgetSnapshots(userId) {
  try {
    const { data, error } = await supabase.from('budget_monthly_snapshots').select('*').eq('user_id', userId).order('month_key')
    if (error) return []
    return data || []
  } catch { return [] }
}
