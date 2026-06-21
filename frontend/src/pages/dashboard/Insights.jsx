import { useState, useEffect } from 'react'
import { Sparkles, AlertTriangle } from 'lucide-react'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Input, PageSection } from '../../components/UI'
import AIInsight from '../../components/AIInsight'
import { MultiLineTrendChart } from '../../components/Chart'
import {
  getSession, getProfile, getTransactions, getNetWorthHistory,
  getSpendingOverTime, monthlyIncome, getExpenses, getDebts, formatCurrency,
} from '../../lib/supabase'
import { callAI } from '../../lib/api'
import { detectAnomalies, predictNetWorth } from '../../lib/financeUtils'
import { FEATURES } from '../../lib/planGating'
import PlanGate from '../../components/PlanGate'
import { usePlan } from '../../context/PlanContext'
import { toastError } from '../../lib/toast'

export default function Insights() {
  const { hasFeature } = usePlan()
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [history, setHistory] = useState([])
  const [token, setToken] = useState(null)
  const [monthlyReport, setMonthlyReport] = useState('')
  const [whatIfResult, setWhatIfResult] = useState('')
  const [whatIfCut, setWhatIfCut] = useState('100')
  const [whatIfCategory, setWhatIfCategory] = useState('Food')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setToken(session.access_token)
      const uid = session.user.id
      const [p, tx, h] = await Promise.all([
        getProfile(uid), getTransactions(uid), getNetWorthHistory(uid),
      ])
      setProfile(p)
      setTransactions(tx)
      setHistory(h)
    }
    load()
  }, [])

  const anomalies = detectAnomalies(transactions)
  const prediction = predictNetWorth(history)
  const income = monthlyIncome(profile?.salary, profile?.pay_frequency)

  async function generateMonthlyReport() {
    if (!token || !hasFeature(FEATURES.AI_INSIGHTS)) return
    setLoading(true)
    try {
      const expenses = await getExpenses(profile.id)
      const debts = await getDebts(profile.id)
      const totalExp = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      const result = await callAI('monthly_report', {
        income,
        totalExpenses: totalExp,
        cashFlow: income - totalExp,
        transactions: transactions.slice(0, 20),
        debtCount: debts.length,
        savings: profile?.savings,
      }, token)
      setMonthlyReport(result)
    } catch (err) {
      toastError(err.message || 'Could not generate report')
    } finally {
      setLoading(false)
    }
  }

  async function runWhatIf() {
    if (!token || !hasFeature(FEATURES.WHAT_IF)) return
    setLoading(true)
    try {
      const result = await callAI('what_if', {
        cutAmount: Number(whatIfCut),
        category: whatIfCategory,
        income,
        monthlyExpenses: transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
        savings: profile?.savings,
        careerGoal: profile?.career_goal,
      }, token)
      setWhatIfResult(result)
    } catch (err) {
      toastError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const predictionChart = prediction ? [
    { label: 'Now', netWorth: prediction.current },
    { label: '+1 mo', netWorth: prediction.current + prediction.monthlyTrend },
    { label: '+2 mo', netWorth: prediction.current + prediction.monthlyTrend * 2 },
    { label: '+3 mo', netWorth: prediction.projected3mo },
  ] : []

  return (
    <DashboardLayout title="Insights" subtitle="AI-powered analysis of your finances">
      <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <PlanGate feature={FEATURES.AI_INSIGHTS} title="Monthly reports require Plus" className="h-full">
        <PageSection
          title="Monthly financial report"
          action={<Button size="sm" onClick={generateMonthlyReport} disabled={loading}>Generate</Button>}
        >
          <AIInsight title="" content={monthlyReport} loading={loading} />
        </PageSection>
        </PlanGate>

        <PlanGate feature={FEATURES.WHAT_IF} title="What-if scenarios require Pro" className="h-full">
        <PageSection title="What-if scenarios">
          <p className="mb-3 text-sm text-muted">See how cutting spending affects your goals.</p>
          <div className="flex flex-wrap gap-2">
            <Input type="number" value={whatIfCut} onChange={(e) => setWhatIfCut(e.target.value)} placeholder="Amount" className="w-28" />
            <Input value={whatIfCategory} onChange={(e) => setWhatIfCategory(e.target.value)} placeholder="Category" className="flex-1 min-w-[120px]" />
            <Button size="sm" onClick={runWhatIf} disabled={loading}>Run</Button>
          </div>
          {whatIfResult && <p className="mt-4 text-sm leading-relaxed text-text/90 whitespace-pre-wrap">{whatIfResult}</p>}
        </PageSection>
        </PlanGate>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-stretch">
        <PlanGate feature={FEATURES.ANOMALY_ALERTS} title="Anomaly alerts require Pro" className="h-full">
        <PageSection title="Spending anomalies">
          {!anomalies.length ? (
            <p className="text-sm text-muted">No unusual transactions detected.</p>
          ) : (
            <ul className="space-y-2">
              {anomalies.map((a) => (
                <li key={a.id} className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 p-3 text-sm">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
                  <span>
                    <strong>{formatCurrency(a.amount)}</strong> on {a.category} ({formatCurrency(a.average)} avg)
                    {a.note ? ` — ${a.note}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </PageSection>
        </PlanGate>

        <PlanGate feature={FEATURES.NET_WORTH_PREDICTION} title="Net worth predictions require Pro" className="h-full">
        <PageSection title="Net worth trend prediction">
          {prediction ? (
            <>
              <p className="mb-3 text-sm text-muted">
                Based on your history: {prediction.monthlyTrend >= 0 ? '+' : ''}{formatCurrency(prediction.monthlyTrend)}/mo trend
              </p>
              <MultiLineTrendChart data={predictionChart} height={180} />
              <p className="mt-2 text-sm">Projected in 3 months: <strong>{formatCurrency(prediction.projected3mo)}</strong></p>
            </>
          ) : (
            <p className="text-sm text-muted">Add more net worth snapshots to see predictions.</p>
          )}
        </PageSection>
        </PlanGate>
      </div>
    </DashboardLayout>
  )
}
