import { useState, useEffect } from 'react'
import { DashboardLayout } from '../../components/Sidebar'
import { StatCard, Input, Button, ProgressBar, PageSection } from '../../components/UI'
import AIInsight from '../../components/AIInsight'
import DonutChart, { CategoryLegend } from '../../components/Chart'
import {
  getSession,
  getProfile,
  getExpenses,
  getTransactions,
  getBudgetLimits,
  upsertBudgetLimit,
  getCategorySpendingData,
  getCategoryUsageThisMonth,
  monthlyIncome,
  formatCurrency,
  EXPENSE_CATEGORIES,
} from '../../lib/supabase'
import { callAI } from '../../lib/api'
import { toastSuccess, toastError } from '../../lib/toast'

export default function Budget() {
  const [profile, setProfile] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [budgetLimits, setBudgetLimits] = useState([])
  const [token, setToken] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [insight, setInsight] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [savings, setSavings] = useState(0)
  const [limitDrafts, setLimitDrafts] = useState({})

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setUserId(session.user.id)
      setToken(session.access_token)
      const [p, e, tx, limits] = await Promise.all([
        getProfile(session.user.id),
        getExpenses(session.user.id),
        getTransactions(session.user.id),
        getBudgetLimits(session.user.id),
      ])
      setProfile(p)
      setExpenses(e)
      setTransactions(tx)
      setBudgetLimits(limits)
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

  const rentExpense = chartData.find((c) => c.name === 'Rent')
  const rentPct = rentExpense && income ? (rentExpense.value / income) * 100 : 0

  async function fetchInsight() {
    if (!token) return
    setInsightLoading(true)
    try {
      const result = await callAI('budget_insight', {
        income,
        expenses: chartData,
        totalExpenses,
        cashFlow,
        runway,
        rentPct,
        savings,
      }, token)
      setInsight(result)
    } catch {
      const rentMsg = rentPct > 30
        ? `You're spending ${rentPct.toFixed(0)}% on rent which is above the recommended 30%. Consider reducing housing costs or increasing income.`
        : `Your rent is ${rentPct.toFixed(0)}% of income — within healthy range.`
      setInsight(`${rentMsg} Monthly cash flow is ${formatCurrency(cashFlow)}. Emergency runway: ${runway.toFixed(1)} months.`)
    } finally {
      setInsightLoading(false)
    }
  }

  useEffect(() => {
    if (profile && token && !loading) fetchInsight()
  }, [profile, token, loading])

  async function saveSavings() {
    const session = await getSession()
    if (!session) return
    const { supabase } = await import('../../lib/supabase')
    try {
      await supabase.from('profiles').update({ savings: Number(savings) }).eq('id', session.user.id)
      toastSuccess('Savings updated')
    } catch {
      toastError('Failed to update savings')
    }
  }

  async function saveLimit(category) {
    if (!userId) return
    const value = limitDrafts[category]
    if (!value || Number(value) <= 0) return
    try {
      await upsertBudgetLimit(userId, category, value)
      toastSuccess(`${category} budget saved`)
      setBudgetLimits(await getBudgetLimits(userId))
    } catch (err) {
      toastError(err.message || 'Failed to save budget')
    }
  }

  const limitMap = Object.fromEntries(budgetLimits.map((l) => [l.category, Number(l.monthly_limit)]))

  return (
    <DashboardLayout title="Budget" subtitle="Track spending and calculate your runway">
      <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
        <StatCard label="Monthly Income" value={formatCurrency(income)} loading={loading} />
        <StatCard
          label="Monthly Expenses"
          value={formatCurrency(totalExpenses)}
          trend={totalExpenses > income ? 'down' : 'up'}
          sub={totalExpenses > income ? 'Over budget' : 'Under budget'}
          loading={loading}
        />
        <StatCard
          label="Cash Flow"
          value={formatCurrency(cashFlow)}
          trend={cashFlow >= 0 ? 'up' : 'down'}
          loading={loading}
        />
      </div>

      <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-2">
        <PageSection title="Spending by Category" className="min-w-0 overflow-hidden">
          <DonutChart data={chartData} size={220} />
          <CategoryLegend data={chartData} />
          {!chartData.length && (
            <p className="mt-3 text-xs text-muted">
              Add expense transactions on the Transactions page to see category breakdown.
            </p>
          )}
        </PageSection>

        <div className="min-w-0 space-y-6">
          <PageSection title="Runway Calculator">
            <p className="text-sm text-muted">
              If you lost your job today, how long could you survive?
            </p>
            <p className="mt-4 font-heading text-4xl font-bold text-mint">
              {runway.toFixed(1)} <span className="text-lg text-muted">months</span>
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input
                label="Current savings ($)"
                type="number"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
              />
              <Button size="sm" onClick={saveSavings}>Update</Button>
            </div>
            <p className="mt-2 text-xs text-muted">
              Based on {formatCurrency(totalExpenses)}/mo expenses · 6 months recommended
            </p>
          </PageSection>

          <AIInsight
            title="Budget Insight"
            content={insight}
            loading={insightLoading}
            onRefresh={fetchInsight}
          />
        </div>
      </div>

      <PageSection title="Category budgets" className="mt-6">
        <p className="mb-4 text-sm text-muted">
          Set monthly limits per category. Usage is calculated from this month&apos;s transactions.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {EXPENSE_CATEGORIES.map((category) => {
            const used = getCategoryUsageThisMonth(transactions, expenses, category)
            const limit = limitMap[category] || Number(limitDrafts[category]) || 0
            const pct = limit > 0 ? (used / limit) * 100 : 0

            return (
              <div key={category} className="rounded-lg border border-border/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{category}</span>
                  <span className="text-sm text-muted">
                    {formatCurrency(used)}{limit > 0 ? ` / ${formatCurrency(limit)}` : ''}
                  </span>
                </div>
                {limit > 0 && (
                  <div className="mt-2">
                    <ProgressBar value={pct} />
                    <p className="mt-1 text-xs text-muted">{pct.toFixed(0)}% used this month</p>
                  </div>
                )}
                <div className="mt-3 flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Monthly limit"
                    value={limitDrafts[category] ?? ''}
                    onChange={(e) => setLimitDrafts({ ...limitDrafts, [category]: e.target.value })}
                    className="flex-1"
                  />
                  <Button size="sm" variant="secondary" onClick={() => saveLimit(category)}>
                    Save
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </PageSection>

      {chartData.length > 0 && (
        <PageSection title="Expense Breakdown" className="mt-6">
          <div className="space-y-2">
            {chartData.map((exp) => {
              const pct = income ? (exp.value / income) * 100 : 0
              const overBudget = exp.name === 'Rent' && pct > 30
              return (
                <div key={exp.name} className="flex items-center justify-between gap-3 border-b border-border/50 py-2 last:border-0">
                  <span className="text-sm">{exp.name}</span>
                  <div className="text-right">
                    <span className="font-medium">{formatCurrency(exp.value)}</span>
                    <span className={`ml-2 text-xs ${overBudget ? 'text-danger' : 'text-muted'}`}>
                      ({pct.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </PageSection>
      )}
    </DashboardLayout>
  )
}
