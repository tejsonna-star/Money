import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '../../components/Sidebar'
import { StatCard, ProgressBar } from '../../components/UI'
import AIInsight from '../../components/AIInsight'
import {
  getSession,
  getProfile,
  getDebts,
  getExpenses,
  monthlyIncome,
  formatCurrency,
} from '../../lib/supabase'
import { callAI } from '../../lib/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [debts, setDebts] = useState([])
  const [expenses, setExpenses] = useState([])
  const [insight, setInsight] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [token, setToken] = useState(null)

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setToken(session.access_token)
      const [p, d, e] = await Promise.all([
        getProfile(session.user.id),
        getDebts(session.user.id),
        getExpenses(session.user.id),
      ])
      setProfile(p)
      setDebts(d)
      setExpenses(e)
    }
    load()
  }, [])

  const income = monthlyIncome(profile?.salary, profile?.pay_frequency)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalDebt = debts.reduce((s, d) => s + Number(d.balance), 0)
  const savings = Number(profile?.savings) || 0
  const netWorth = savings - totalDebt
  const cashFlow = income - totalExpenses

  const initialDebt = debts.reduce((s, d) => s + Number(d.balance), 0)
  const debtProgress = initialDebt > 0 ? ((initialDebt - totalDebt) / initialDebt) * 100 : 0

  async function fetchInsight() {
    if (!token) return
    setInsightLoading(true)
    try {
      const result = await callAI('dashboard_insight', {
        salary: profile?.salary,
        payFrequency: profile?.pay_frequency,
        careerGoal: profile?.career_goal,
        totalDebt,
        totalExpenses,
        income,
        cashFlow,
        debtCount: debts.length,
      }, token)
      setInsight(result)
    } catch (err) {
      setInsight(err.message || 'AI request failed. Try again in a moment.')
    } finally {
      setInsightLoading(false)
    }
  }

  useEffect(() => {
    if (profile && token) {
      const t = setTimeout(() => fetchInsight(), 100)
      return () => clearTimeout(t)
    }
  }, [profile, token])

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Welcome back${profile?.career_goal ? ` — working toward: ${profile.career_goal}` : ''}`}
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Net Worth"
          value={formatCurrency(netWorth)}
          sub={netWorth >= 0 ? 'Assets minus debts' : 'Keep building'}
          trend={netWorth >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Monthly Cash Flow"
          value={formatCurrency(cashFlow)}
          sub={cashFlow >= 0 ? 'Income minus expenses' : 'Spending exceeds income'}
          trend={cashFlow >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label="Total Debt"
          value={formatCurrency(totalDebt)}
          sub={`${debts.length} active ${debts.length === 1 ? 'account' : 'accounts'}`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-heading text-lg font-semibold">Debt Payoff Progress</h3>
          <p className="mt-1 text-sm text-muted">
            {totalDebt > 0
              ? `${formatCurrency(totalDebt)} remaining across ${debts.length} debts`
              : 'No debts tracked — great work!'}
          </p>
          <div className="mt-4">
            <ProgressBar value={debtProgress || (totalDebt === 0 ? 100 : 0)} />
          </div>
          <p className="mt-2 text-xs text-muted">
            {totalDebt > 0 ? 'Visit Debt Tracker for payoff strategies' : '100% debt free'}
          </p>
        </div>

        <AIInsight
          title="Your next move"
          content={insight}
          loading={insightLoading}
          onRefresh={fetchInsight}
          actionLabel="Open AI Chat"
          onAction={() => navigate('/dashboard/chat')}
        />
      </div>
    </DashboardLayout>
  )
}
