import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { TrendingUp, Wallet, CreditCard, ArrowRight, Building2 } from 'lucide-react'
import { DashboardLayout } from '../../components/Sidebar'
import { StatCard, ProgressBar, PageSection, Skeleton, Button } from '../../components/UI'
import AIInsight from '../../components/AIInsight'
import OnboardingChecklist from '../../components/OnboardingChecklist'
import FinancialHealthCard from '../../components/FinancialHealthCard'
import WeeklySummaryCard from '../../components/WeeklySummaryCard'
import ChangelogModal from '../../components/ChangelogModal'
import { LineTrendChart, MultiLineTrendChart } from '../../components/Chart'
import { useKeyboardShortcuts, KeyboardHints } from '../../lib/keyboardShortcuts.jsx'
import { MONTHLY_CHALLENGES } from '../../lib/constants'
import { FEATURES } from '../../lib/planGating'
import PlanGate from '../../components/PlanGate'
import { usePlan } from '../../context/PlanContext'
import {
  getSession, getProfile, getDebts, getExpenses, getTransactions, getAccounts,
  getNetWorthHistory, recordNetWorthSnapshot, getSpendingOverTime, getGamification,
  processRecurringTransactions, recordActivity, monthlyIncome,
  formatCurrency, formatDate, formatDateTime,
} from '../../lib/supabase'
import { callAI } from '../../lib/api'
import { computeNetWorthFromAccounts, calculateHealthScore, computeBadges } from '../../lib/financeUtils'

export default function Dashboard() {
  useKeyboardShortcuts()
  const { hasFeature } = usePlan()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [debts, setDebts] = useState([])
  const [expenses, setExpenses] = useState([])
  const [transactions, setTransactions] = useState([])
  const [allTransactions, setAllTransactions] = useState([])
  const [netWorthHistory, setNetWorthHistory] = useState([])
  const [gamification, setGamification] = useState(null)
  const [insight, setInsight] = useState('')
  const [weeklySummary, setWeeklySummary] = useState('')
  const [insightLoading, setInsightLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [showChangelog, setShowChangelog] = useState(false)
  const [token, setToken] = useState(null)
  const currency = profile?.currency || 'USD'

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setToken(session.access_token)
      const uid = session.user.id
      await processRecurringTransactions(uid)
      const streak = await recordActivity(uid)
      const [p, accts, d, e, allTx, recentTx, history, g] = await Promise.all([
        getProfile(uid), getAccounts(uid), getDebts(uid), getExpenses(uid),
        getTransactions(uid), getTransactions(uid, 5), getNetWorthHistory(uid), getGamification(uid),
      ])
      setProfile(p)
      setAccounts(accts)
      setDebts(d)
      setExpenses(e)
      setTransactions(recentTx)
      setAllTransactions(allTx)
      setNetWorthHistory(history)
      setGamification(g || { streak_days: streak, badges: [], health_score: 50 })
      setLastUpdated(new Date())
      setLoading(false)

      const nw = accts.length ? computeNetWorthFromAccounts(accts, d) : (Number(p?.savings) || 0) - d.reduce((s, x) => s + Number(x.balance), 0)
      recordNetWorthSnapshot(uid, nw)
    }
    load()
  }, [])

  const income = monthlyIncome(profile?.salary, profile?.pay_frequency)
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const totalDebt = debts.reduce((s, d) => s + Number(d.balance), 0)
  const netWorth = accounts.length
    ? computeNetWorthFromAccounts(accounts, debts)
    : (Number(profile?.savings) || 0) - totalDebt
  const cashFlow = income - totalExpenses
  const runway = totalExpenses > 0 ? (Number(profile?.savings) || 0) / totalExpenses : 0
  const debtProgress = totalDebt === 0 ? 100 : 0

  const healthScore = calculateHealthScore({
    cashFlow, runway, debtToIncome: income ? totalDebt / (income * 12) : 0,
    budgetAdherence: 0.85, streakDays: gamification?.streak_days || 0,
  })
  const badges = computeBadges({ goals: [], debts, runway, streakDays: gamification?.streak_days, gamification })

  const spendingTrend = getSpendingOverTime(allTransactions, 6)
  const netWorthChart = netWorthHistory.length
    ? netWorthHistory.map((s) => ({
        label: new Date(s.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        netWorth: Number(s.net_worth),
      }))
    : [{ label: 'Today', netWorth }]

  async function fetchInsight() {
    if (!token || !hasFeature(FEATURES.AI_INSIGHTS)) return
    setInsightLoading(true)
    try {
      setInsight(await callAI('dashboard_insight', { careerGoal: profile?.career_goal, totalDebt, totalExpenses, income, cashFlow, debtCount: debts.length }, token))
    } catch (err) {
      setInsight(err.message || 'AI unavailable')
    } finally {
      setInsightLoading(false)
    }
  }

  async function fetchWeeklySummary() {
    if (!token || !hasFeature(FEATURES.WEEKLY_SUMMARY) || profile?.notification_prefs?.weekly_summary === false) return
    setSummaryLoading(true)
    try {
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weeklyExp = allTransactions.filter((t) => t.type === 'expense' && new Date(t.transaction_date) >= weekAgo).reduce((s, t) => s + Number(t.amount), 0)
      setWeeklySummary(await callAI('weekly_summary', { income, weeklyExpenses: weeklyExp, cashFlow, healthScore, streakDays: gamification?.streak_days }, token))
    } catch {
      setWeeklySummary('')
    } finally {
      setSummaryLoading(false)
    }
  }

  useEffect(() => {
    if (profile && token && !loading) {
      fetchInsight()
      fetchWeeklySummary()
    }
  }, [profile, token, loading])

  const challenge = MONTHLY_CHALLENGES[0]

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Welcome back${profile?.career_goal ? ` — ${profile.career_goal}` : ''}`}
      lastUpdated={lastUpdated ? formatDateTime(lastUpdated) : null}
      headerAction={
        <Button size="sm" variant="ghost" onClick={() => setShowChangelog(true)}>What&apos;s new</Button>
      }
    >
      <ChangelogModal open={showChangelog} onClose={() => setShowChangelog(false)} />
      <OnboardingChecklist checklist={profile?.onboarding_checklist || {}} />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <FinancialHealthCard
          score={healthScore}
          streak={gamification?.streak_days || 0}
          badges={badges}
          challenge={challenge}
          onCompleteChallenge={() => navigate('/dashboard/transactions')}
        />
        <div className="lg:col-span-2">
          <PlanGate feature={FEATURES.WEEKLY_SUMMARY} title="Weekly summary requires Plus">
            <WeeklySummaryCard summary={weeklySummary} loading={summaryLoading} />
          </PlanGate>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Net Worth" value={formatCurrency(netWorth, currency)} sub={accounts.length ? 'From linked accounts' : 'Assets minus debts'} trend={netWorth >= 0 ? 'up' : 'down'} icon={TrendingUp} loading={loading} />
        <StatCard label="Monthly Cash Flow" value={formatCurrency(cashFlow, currency)} trend={cashFlow >= 0 ? 'up' : 'down'} icon={Wallet} loading={loading} />
        <StatCard label="Total Debt" value={formatCurrency(totalDebt, currency)} sub={`${debts.length} accounts`} icon={CreditCard} loading={loading} />
      </div>

      <PageSection title="Accounts" className="mt-6" action={<Link to="/dashboard/accounts" className="text-sm text-accent hover:underline">Manage</Link>}>
        {loading ? <Skeleton className="h-16 w-full" /> : !accounts.length ? (
          <p className="text-sm text-muted"><Link to="/dashboard/accounts" className="text-accent hover:underline">Add accounts</Link> to track net worth automatically.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {accounts.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border border-border/50 px-4 py-3">
                <Building2 className="h-4 w-4 text-accent" />
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{a.name}</p><p className="text-xs text-muted capitalize">{a.type}</p></div>
                <span className="font-semibold">{formatCurrency(a.balance, currency)}</span>
              </div>
            ))}
          </div>
        )}
      </PageSection>

      <PlanGate feature={FEATURES.SPENDING_CHARTS} title="Spending charts require Plus">
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PageSection title="Spending over time">{loading ? <Skeleton className="h-[220px]" /> : <LineTrendChart data={spendingTrend} dataKey="spending" color="#FF4D6A" />}</PageSection>
        <PageSection title="Net worth history">{loading ? <Skeleton className="h-[220px]" /> : <MultiLineTrendChart data={netWorthChart} />}</PageSection>
      </div>
      </PlanGate>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PageSection title="Debt payoff"><ProgressBar value={debtProgress} /><p className="mt-2 text-xs text-muted">{totalDebt > 0 ? formatCurrency(totalDebt) + ' remaining' : 'Debt free'}</p></PageSection>
        <PlanGate feature={FEATURES.AI_INSIGHTS} title="AI insights require Plus">
          <AIInsight title="Your next move" content={insight} loading={insightLoading} onRefresh={fetchInsight} actionLabel="Insights" onAction={() => navigate('/dashboard/insights')} prominent />
        </PlanGate>
      </div>

      <PageSection title="Recent transactions" className="mt-6" action={<Link to="/dashboard/transactions" className="flex items-center gap-1 text-sm text-accent hover:underline">View all <ArrowRight className="h-3.5 w-3.5" /></Link>}>
        {loading ? <Skeleton className="h-12" /> : !transactions.length ? (
          <p className="text-sm text-muted">No transactions yet.</p>
        ) : transactions.map((t) => (
          <div key={t.id} className="flex justify-between border-b border-border/50 py-2 last:border-0">
            <span>{t.category} · {formatDate(t.transaction_date)}</span>
            <span className={t.type === 'income' ? 'text-mint' : ''}>{t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}</span>
          </div>
        ))}
      </PageSection>

      <div className="mt-6"><KeyboardHints /></div>
    </DashboardLayout>
  )
}
