import { useState, useEffect } from 'react'
import { DashboardLayout } from '../../components/Sidebar'
import { StatCard, Input, Button } from '../../components/UI'
import AIInsight from '../../components/AIInsight'
import DonutChart, { CategoryLegend } from '../../components/Chart'
import {
  getSession,
  getProfile,
  getExpenses,
  monthlyIncome,
  formatCurrency,
} from '../../lib/supabase'
import { callAI } from '../../lib/api'

export default function Budget() {
  const [profile, setProfile] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [token, setToken] = useState(null)
  const [insight, setInsight] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [savings, setSavings] = useState(0)

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setToken(session.access_token)
      const [p, e] = await Promise.all([
        getProfile(session.user.id),
        getExpenses(session.user.id),
      ])
      setProfile(p)
      setExpenses(e)
      setSavings(Number(p?.savings) || 0)
    }
    load()
  }, [])

  const income = monthlyIncome(profile?.salary, profile?.pay_frequency)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const cashFlow = income - totalExpenses
  const runway = totalExpenses > 0 ? savings / totalExpenses : 0

  const chartData = expenses
    .filter((e) => Number(e.amount) > 0)
    .map((e) => ({ name: e.category, value: Number(e.amount) }))

  const rentExpense = expenses.find((e) => e.category === 'Rent')
  const rentPct = rentExpense && income ? (Number(rentExpense.amount) / income) * 100 : 0

  async function fetchInsight() {
    if (!token) return
    setInsightLoading(true)
    try {
      const result = await callAI('budget_insight', {
        income,
        expenses,
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
    if (profile && token) fetchInsight()
  }, [profile, token])

  async function saveSavings() {
    const session = await getSession()
    if (!session) return
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('profiles').update({ savings: Number(savings) }).eq('id', session.user.id)
  }

  return (
    <DashboardLayout title="Budget" subtitle="Track spending and calculate your runway">
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          label="Monthly Income"
          value={formatCurrency(income)}
        />
        <StatCard
          label="Monthly Expenses"
          value={formatCurrency(totalExpenses)}
          trend={totalExpenses > income ? 'down' : 'up'}
          sub={totalExpenses > income ? 'Over budget' : 'Under budget'}
        />
        <StatCard
          label="Cash Flow"
          value={formatCurrency(cashFlow)}
          trend={cashFlow >= 0 ? 'up' : 'down'}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-heading text-lg font-semibold">Spending by Category</h3>
          <DonutChart data={chartData} size={220} />
          <CategoryLegend data={chartData} />
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-heading text-lg font-semibold">Runway Calculator</h3>
            <p className="mt-1 text-sm text-muted">
              If you lost your job today, how long could you survive?
            </p>
            <p className="mt-4 font-heading text-4xl font-bold text-mint">
              {runway.toFixed(1)} <span className="text-lg text-muted">months</span>
            </p>
            <div className="mt-4 flex gap-3">
              <Input
                label="Current savings ($)"
                type="number"
                value={savings}
                onChange={(e) => setSavings(e.target.value)}
              />
              <div className="flex items-end">
                <Button size="sm" onClick={saveSavings}>Update</Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-muted">
              Based on ${totalExpenses.toLocaleString()}/mo expenses · 6 months recommended
            </p>
          </div>

          <AIInsight
            title="Budget Insight"
            content={insight}
            loading={insightLoading}
            onRefresh={fetchInsight}
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <h3 className="font-heading text-lg font-semibold">Expense Breakdown</h3>
        <div className="mt-4 space-y-2">
          {expenses.map((exp) => {
            const pct = income ? (Number(exp.amount) / income) * 100 : 0
            const overBudget = exp.category === 'Rent' && pct > 30
            return (
              <div key={exp.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm">{exp.category}</span>
                <div className="text-right">
                  <span className="font-medium">{formatCurrency(exp.amount)}</span>
                  <span className={`ml-2 text-xs ${overBudget ? 'text-danger' : 'text-muted'}`}>
                    ({pct.toFixed(0)}%)
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </DashboardLayout>
  )
}
