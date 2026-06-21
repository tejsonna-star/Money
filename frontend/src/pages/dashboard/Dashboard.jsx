import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { TrendingUp, Wallet, CreditCard, ArrowRight } from 'lucide-react'
import { DashboardLayout } from '../../components/Sidebar'
import { StatCard, ProgressBar, PageSection, Skeleton } from '../../components/UI'
import AIInsight from '../../components/AIInsight'
import { LineTrendChart, MultiLineTrendChart } from '../../components/Chart'
import {
  getSession,
  getProfile,
  getDebts,
  getExpenses,
  getTransactions,
  getNetWorthHistory,
  recordNetWorthSnapshot,
  getSpendingOverTime,
  monthlyIncome,
  formatCurrency,
  formatDate,
  formatDateTime,
} from '../../lib/supabase'
import { callAI } from '../../lib/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [debts, setDebts] = useState([])
  const [expenses, setExpenses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [allTransactions, setAllTransactions] = useState([])
  const [netWorthHistory, setNetWorthHistory] = useState([])
  const [insight, setInsight] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [token, setToken] = useState(null)

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setToken(session.access_token)
      const uid = session.user.id
      const [p, d, e, allTx, recentTx, history] = await Promise.all([
        getProfile(uid),
        getDebts(uid),
        getExpenses(uid),
        getTransactions(uid),
        getTransactions(uid, 5),
        getNetWorthHistory(uid),
      ])
      setProfile(p)
      setDebts(d)
      setExpenses(e)
      setTransactions(recentTx)
      setAllTransactions(allTx)
      setNetWorthHistory(history)
      setLastUpdated(new Date())
      setLoading(false)

      const savings = Number(p?.savings) || 0
      const totalDebt = d.reduce((s, x) => s + Number(x.balance), 0)
      recordNetWorthSnapshot(uid, savings - totalDebt)
    }
    load()
  }, [])

  const income = monthlyIncome(profile?.salary, profile?.pay_frequency)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalDebt = debts.reduce((s, d) => s + Number(d.balance), 0)
  const totalOriginal = debts.reduce((s, d) => s + (Number(d.original_balance) || Number(d.balance)), 0)
  const paidOff = Math.max(0, totalOriginal - totalDebt)
  const debtProgress = totalOriginal > 0 ? (paidOff / totalOriginal) * 100 : (totalDebt === 0 ? 100 : 0)

  const spendingTrend = getSpendingOverTime(allTransactions, 6)
  const netWorthChart = netWorthHistory.length
    ? netWorthHistory.map((s) => ({
        label: new Date(s.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        netWorth: Number(s.net_worth),
      }))
    : [{ label: 'Today', netWorth }]

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
    if (profile && token && !loading) {
      const t = setTimeout(() => fetchInsight(), 100)
      return () => clearTimeout(t)
    }
  }, [profile, token, loading])

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Welcome back${profile?.career_goal ? ` — working toward: ${profile.career_goal}` : ''}`}
      lastUpdated={lastUpdated ? formatDateTime(lastUpdated) : null}
    >
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Net Worth"
          value={formatCurrency(netWorth)}
          sub={netWorth >= 0 ? 'Assets minus debts' : 'Keep building'}
          trend={netWorth >= 0 ? 'up' : 'down'}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          label="Monthly Cash Flow"
          value={formatCurrency(cashFlow)}
          sub={cashFlow >= 0 ? 'Income minus expenses' : 'Spending exceeds income'}
          trend={cashFlow >= 0 ? 'up' : 'down'}
          icon={Wallet}
          loading={loading}
        />
        <StatCard
          label="Total Debt"
          value={formatCurrency(totalDebt)}
          sub={`${debts.length} active ${debts.length === 1 ? 'account' : 'accounts'}`}
          icon={CreditCard}
          loading={loading}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PageSection title="Spending over time">
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <LineTrendChart data={spendingTrend} dataKey="spending" color="#FF4D6A" />
          )}
        </PageSection>

        <PageSection title="Net worth history">
          {loading ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <MultiLineTrendChart data={netWorthChart} />
          )}
        </PageSection>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PageSection title="Debt Payoff Progress">
          <p className="text-sm text-muted">
            {totalDebt > 0
              ? `${formatCurrency(totalDebt)} remaining across ${debts.length} debts`
              : 'No debts tracked — great work!'}
          </p>
          <div className="mt-4">
            {loading ? <Skeleton className="h-2 w-full" /> : (
              <ProgressBar value={debtProgress || (totalDebt === 0 ? 100 : 0)} />
            )}
          </div>
          <p className="mt-2 text-xs text-muted">
            {totalDebt > 0 ? 'Visit Debt Tracker for payoff strategies' : '100% debt free'}
          </p>
        </PageSection>

        <AIInsight
          title="Your next move"
          content={insight}
          loading={insightLoading}
          onRefresh={fetchInsight}
          actionLabel="Open AI Chat"
          onAction={() => navigate('/dashboard/chat')}
          prominent
        />
      </div>

      <PageSection
        title="Recent transactions"
        className="mt-6"
        action={
          <Link to="/dashboard/transactions" className="flex items-center gap-1 text-sm text-accent hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      >
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !transactions.length ? (
          <p className="text-sm text-muted">
            No transactions yet.{' '}
            <Link to="/dashboard/transactions" className="text-accent hover:underline">Add your first one</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{t.category}</p>
                  <p className="text-xs text-muted">{formatDate(t.transaction_date)}</p>
                </div>
                <span className={`shrink-0 font-semibold ${t.type === 'income' ? 'text-mint' : 'text-text'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </PageSection>
    </DashboardLayout>
  )
}
