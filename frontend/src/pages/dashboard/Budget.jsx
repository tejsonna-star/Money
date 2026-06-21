import { useState, useEffect, useMemo } from 'react'
import { AlertTriangle } from 'lucide-react'
import { DashboardLayout } from '../../components/Sidebar'
import { StatCard, Input, Button, ProgressBar, PageSection, Select } from '../../components/UI'
import AIInsight from '../../components/AIInsight'
import DonutChart, { CategoryLegend } from '../../components/Chart'
import {
  getSession, getProfile, getExpenses, getTransactions, getBudgetLimits,
  upsertBudgetLimit, getCategorySpendingData, getCategoryUsageThisMonth,
  monthlyIncome, formatCurrency, updateProfile, getBudgetSnapshots, saveBudgetSnapshot,
} from '../../lib/supabase'
import { BUDGET_TEMPLATES } from '../../lib/constants'
import { applyBudgetRollover } from '../../lib/financeUtils'
import { callAI } from '../../lib/api'
import { toastSuccess, toastError } from '../../lib/toast'

function currentMonthKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function Budget() {
  const [profile, setProfile] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [budgetLimits, setBudgetLimits] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [token, setToken] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [savings, setSavings] = useState(0)
  const [limitDrafts, setLimitDrafts] = useState({})
  const [template, setTemplate] = useState('')
  const [view, setView] = useState('monthly')

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setToken(session.access_token)
      setUserId(session.user.id)
      const [p, e, tx, limits, snaps] = await Promise.all([
        getProfile(session.user.id), getExpenses(session.user.id),
        getTransactions(session.user.id), getBudgetLimits(session.user.id),
        getBudgetSnapshots(session.user.id),
      ])
      setProfile(p)
      setExpenses(e)
      setTransactions(tx)
      setBudgetLimits(limits)
      setSnapshots(snaps)
      setSavings(Number(p?.savings) || 0)
      const drafts = {}
      limits.forEach((l) => { drafts[l.category] = String(l.monthly_limit) })
      setLimitDrafts(drafts)
      setLoading(false)
    }
    load()
  }, [])

  const income = monthlyIncome(profile?.salary, profile?.pay_frequency)
  const chartData = getCategorySpendingData(transactions, expenses)
  const totalExpenses = chartData.reduce((s, c) => s + c.value, 0)
  const cashFlow = income - totalExpenses
  const runway = totalExpenses > 0 ? savings / totalExpenses : 0

  const categorySpending = useMemo(() => {
    const map = {}
    chartData.forEach((c) => { map[c.name] = c.value })
    return map
  }, [chartData])

  const rolloverData = applyBudgetRollover(
    budgetLimits.length ? budgetLimits : Object.keys(limitDrafts).map((c) => ({ category: c, monthly_limit: limitDrafts[c] || 0, rollover_balance: 0 })),
    categorySpending
  )

  const overBudget = rolloverData.filter((r) => r.overBudget)
  const prefs = profile?.notification_prefs || {}
  const showAlerts = prefs.budget_alerts !== false && overBudget.length > 0

  const annualMonths = useMemo(() => {
    const months = []
    const now = new Date()
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return months
  }, [])

  async function fetchInsight() {
    if (!token) return
    setInsightLoading(true)
    try {
      const result = await callAI('budget_insight', { income, expenses: chartData, totalExpenses, cashFlow, runway, savings, rentPct: 0 }, token)
      setInsight(result)
    } catch {
      setInsight(`Monthly cash flow is ${formatCurrency(cashFlow)}. Emergency runway: ${runway.toFixed(1)} months.`)
    } finally {
      setInsightLoading(false)
    }
  }

  useEffect(() => { if (profile && token && !loading) fetchInsight() }, [profile, token, loading])

  async function saveLimit(category) {
    if (!userId) return
    const value = limitDrafts[category]
    if (!value) return
    try {
      await upsertBudgetLimit(userId, category, value)
      await updateProfile(userId, { onboarding_checklist: { ...(profile?.onboarding_checklist || {}), budget: true } })
      await saveBudgetSnapshot(userId, category, currentMonthKey(), categorySpending[category] || 0, Number(value), 0)
      toastSuccess(`${category} budget saved`)
      setBudgetLimits(await getBudgetLimits(userId))
    } catch (err) {
      toastError(err.message)
    }
  }

  async function applyTemplate() {
    if (!userId || !template) return
    const tpl = BUDGET_TEMPLATES[template]
    if (!tpl) return
    try {
      await Promise.all(Object.entries(tpl.limits).map(([cat, lim]) => upsertBudgetLimit(userId, cat, lim)))
      toastSuccess(`${tpl.label} template applied`)
      setBudgetLimits(await getBudgetLimits(userId))
      setLimitDrafts(Object.fromEntries(Object.entries(tpl.limits).map(([k, v]) => [k, String(v)])))
    } catch (err) {
      toastError(err.message)
    }
  }

  async function rolloverMonth() {
    if (!userId) return
    try {
      for (const r of rolloverData) {
        await upsertBudgetLimit(userId, r.category, r.monthly_limit || limitDrafts[r.category] || 0)
        // Store rollover for next month via rollover_balance
        const { supabase } = await import('../../lib/supabase')
        await supabase.from('budget_limits').update({ rollover_balance: r.nextRollover }).eq('user_id', userId).eq('category', r.category)
      }
      toastSuccess('Unused budget rolled over to next month')
      setBudgetLimits(await getBudgetLimits(userId))
    } catch (err) {
      toastError(err.message)
    }
  }

  return (
    <DashboardLayout title="Budget" subtitle="YNAB-style limits with rollover and templates">
      {showAlerts && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          <span>Over budget in: {overBudget.map((o) => `${o.category} (+${formatCurrency(o.spent - o.effective)})`).join(', ')}</span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <Button size="sm" variant={view === 'monthly' ? 'primary' : 'secondary'} onClick={() => setView('monthly')}>Monthly</Button>
        <Button size="sm" variant={view === 'annual' ? 'primary' : 'secondary'} onClick={() => setView('annual')}>Annual view</Button>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        <StatCard label="Monthly Income" value={formatCurrency(income)} loading={loading} />
        <StatCard label="Monthly Expenses" value={formatCurrency(totalExpenses)} loading={loading} />
        <StatCard label="Cash Flow" value={formatCurrency(cashFlow)} trend={cashFlow >= 0 ? 'up' : 'down'} loading={loading} />
      </div>

      {view === 'monthly' ? (
        <>
          <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-2">
            <PageSection title="Spending by Category" className="min-w-0 overflow-hidden">
              <DonutChart data={chartData} size={220} />
              <CategoryLegend data={chartData} />
            </PageSection>
            <AIInsight title="Budget Insight" content={insight} loading={insightLoading} onRefresh={fetchInsight} />
          </div>

          <PageSection title="Budget templates & rollover" className="mt-6">
            <div className="flex flex-wrap gap-2">
              <Select value={template} onChange={(e) => setTemplate(e.target.value)} className="w-48">
                <option value="">Choose template...</option>
                {Object.entries(BUDGET_TEMPLATES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
              <Button size="sm" onClick={applyTemplate} disabled={!template}>Apply template</Button>
              <Button size="sm" variant="secondary" onClick={rolloverMonth}>Roll over unused budget</Button>
            </div>
          </PageSection>

          <PageSection title="Category budgets" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {rolloverData.map((row) => (
                <div key={row.category} className={`rounded-lg border p-4 ${row.overBudget ? 'border-danger/40 bg-danger/5' : 'border-border/60'}`}>
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{row.category}</span>
                    <span className="text-sm text-muted">{formatCurrency(row.spent)} / {formatCurrency(row.effective)}</span>
                  </div>
                  {Number(row.rollover_balance) > 0 && <p className="mt-1 text-xs text-mint">+{formatCurrency(row.rollover_balance)} rolled over</p>}
                  <div className="mt-2"><ProgressBar value={row.effective > 0 ? (row.spent / row.effective) * 100 : 0} /></div>
                  <div className="mt-3 flex gap-2">
                    <Input type="number" placeholder="Monthly limit" value={limitDrafts[row.category] ?? ''} onChange={(e) => setLimitDrafts({ ...limitDrafts, [row.category]: e.target.value })} />
                    <Button size="sm" variant="secondary" onClick={() => saveLimit(row.category)}>Save</Button>
                  </div>
                </div>
              ))}
            </div>
          </PageSection>
        </>
      ) : (
        <PageSection title="Annual budget (12 months)" className="mt-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="py-2 pr-4">Month</th>
                  <th className="py-2">Spent</th>
                  <th className="py-2">Limit</th>
                </tr>
              </thead>
              <tbody>
                {annualMonths.map((m) => {
                  const snap = snapshots.filter((s) => s.month_key === m)
                  const spent = snap.reduce((s, x) => s + Number(x.spent), 0) || (m === currentMonthKey() ? totalExpenses : 0)
                  const limit = snap.reduce((s, x) => s + Number(x.limit_amount), 0) || budgetLimits.reduce((s, l) => s + Number(l.monthly_limit), 0)
                  return (
                    <tr key={m} className="border-b border-border/50">
                      <td className="py-2 pr-4">{m}</td>
                      <td className="py-2">{formatCurrency(spent)}</td>
                      <td className="py-2">{formatCurrency(limit)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </PageSection>
      )}
    </DashboardLayout>
  )
}
