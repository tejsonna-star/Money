import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Input, Card } from '../../components/UI'
import AIInsight from '../../components/AIInsight'
import ChatBox from '../../components/ChatBox'
import {
  getSession,
  getProfile,
  getExpenses,
  getDebts,
  monthlyIncome,
  formatCurrency,
} from '../../lib/supabase'
import { callAI, sendChatMessage } from '../../lib/api'

export default function Career() {
  const [tab, setTab] = useState('raise')
  const [profile, setProfile] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  // Raise negotiator fields
  const [salary, setSalary] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [city, setCity] = useState('')
  const [achievements, setAchievements] = useState('')

  // Raise results
  const [raiseResult, setRaiseResult] = useState(null)

  // Career move fields
  const [targetExpenses, setTargetExpenses] = useState('')
  const [targetSalary, setTargetSalary] = useState('')
  const [savings, setSavings] = useState(0)
  const [careerMoveResult, setCareerMoveResult] = useState(null)

  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const [debts, setDebts] = useState([])

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setToken(session.access_token)
      const [p, e, d] = await Promise.all([
        getProfile(session.user.id),
        getExpenses(session.user.id),
        getDebts(session.user.id),
      ])
      setProfile(p)
      setExpenses(e)
      setDebts(d)
      setSalary(String(p?.salary || ''))
      setJobTitle(p?.job_title || '')
      setYearsExp(String(p?.years_experience || ''))
      setCity(p?.city || '')
      setSavings(Number(p?.savings) || 0)

      const totalExp = e.reduce((s, x) => s + Number(x.amount), 0)
      setTargetExpenses(String(totalExp || ''))

      const inc = monthlyIncome(p?.salary, p?.pay_frequency)
      const totalDebt = d.reduce((s, x) => s + Number(x.balance), 0)
      setChatMessages([{
        role: 'assistant',
        content: `I'm your career advisor. Ask about salary negotiation, side income ideas, or job market strategy. You're earning ~${formatCurrency(inc)}/mo with ${formatCurrency(totalDebt)} in debt.`,
        stream: false,
      }])
    }
    load()
  }, [])

  const monthlyExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
  const runway = monthlyExpenses > 0 ? savings / monthlyExpenses : 0
  const recommendedRunway = 6
  const neededSavings = (Number(targetExpenses) || monthlyExpenses) * recommendedRunway
  const savingsGap = Math.max(0, neededSavings - savings)
  const income = monthlyIncome(profile?.salary, profile?.pay_frequency)
  const monthlySurplus = income - monthlyExpenses
  const monthsToGoal = monthlySurplus > 0 ? Math.ceil(savingsGap / monthlySurplus) : Infinity

  async function generateRaiseScript() {
    if (!token) return
    setLoading(true)
    try {
      const result = await callAI('raise_script', {
        salary: Number(salary),
        jobTitle,
        yearsExperience: Number(yearsExp),
        city,
        achievements,
      }, token)
      setRaiseResult(result)
    } catch {
      const estLow = Number(salary) * 0.9
      const estHigh = Number(salary) * 1.15
      setRaiseResult({
        range: `${formatCurrency(estLow)} – ${formatCurrency(estHigh)}`,
        status: Number(salary) < estLow ? 'underpaid' : 'fairly paid',
        script: `Thank you for meeting with me. Over the past year, I've ${achievements || 'delivered strong results across my key responsibilities'}. Based on my research for ${jobTitle} roles in ${city}, the market range is ${formatCurrency(estLow)}–${formatCurrency(estHigh)}. I'd like to discuss aligning my compensation with the value I bring.`,
        talkingPoints: [
          achievements ? `Highlight: ${achievements.split('.')[0]}` : 'Quantify your top achievement with numbers',
          `Market data for ${jobTitle} in ${city} supports a higher range`,
          'Express commitment to continued growth and impact',
        ],
      })
    } finally {
      setLoading(false)
    }
  }

  async function analyzeCareerMove() {
    if (!token) return
    setLoading(true)
    try {
      const result = await callAI('career_move', {
        savings,
        monthlyExpenses: Number(targetExpenses) || monthlyExpenses,
        targetSalary: Number(targetSalary),
        runway,
        savingsGap,
        monthsToGoal,
        income,
      }, token)
      setCareerMoveResult(result)
    } catch {
      setCareerMoveResult(
        monthsToGoal === Infinity
          ? `You currently have ${runway.toFixed(1)} months of runway but no monthly surplus to save. Cut expenses or build income before quitting. You need ${formatCurrency(neededSavings)} (${recommendedRunway} months of expenses).`
          : `You have ${runway.toFixed(1)} months runway now. To quit safely, save ${formatCurrency(savingsGap)} more — about ${monthsToGoal} months at your current surplus of ${formatCurrency(monthlySurplus)}/mo.`
      )
    } finally {
      setLoading(false)
    }
  }

  function copyScript() {
    if (raiseResult?.script) {
      navigator.clipboard.writeText(raiseResult.script)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  async function handleCareerChat(text) {
    if (!token) return
    const userMsg = { role: 'user', content: text }
    setChatMessages((prev) => [...prev, userMsg])
    setChatLoading(true)
    const totalDebt = debts.reduce((s, d) => s + Number(d.balance), 0)
    try {
      const reply = await sendChatMessage(
        text,
        chatMessages.filter((m) => m.role === 'user' || m.role === 'assistant'),
        {
          careerGoal: profile?.career_goal,
          jobTitle: profile?.job_title,
          salary: profile?.salary,
          monthlyIncome: income,
          monthlyExpenses: monthlyExpenses,
          cashFlow: income - monthlyExpenses,
          totalDebt,
          savings,
          city: profile?.city,
          yearsExperience: profile?.years_experience,
        },
        token
      )
      setChatMessages((prev) => [...prev, { role: 'assistant', content: reply, stream: true }])
    } catch (err) {
      setChatMessages((prev) => [...prev, {
        role: 'assistant',
        content: err.message || 'Something went wrong. Try again.',
        stream: true,
      }])
    } finally {
      setChatLoading(false)
    }
  }

  const statusColors = {
    underpaid: 'text-danger',
    'fairly paid': 'text-mint',
    overpaid: 'text-accent',
  }

  return (
    <DashboardLayout title="Career Coach" subtitle="Know your worth and plan your next move">
      <div className="mb-6 flex flex-wrap gap-2 border-b border-border">
        {[
          { id: 'raise', label: 'Raise Negotiator' },
          { id: 'move', label: 'Career Move Calculator' },
          { id: 'advisor', label: 'AI Career Advisor' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === id
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'raise' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="font-heading text-lg font-semibold">Your details</h3>
            <div className="mt-4 space-y-4">
              <Input label="Current salary ($)" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} />
              <Input label="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Senior Software Engineer" />
              <Input label="Years of experience" type="number" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} />
              <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="San Francisco, CA" />
              <label className="block">
                <span className="mb-1.5 block text-sm text-muted">Recent wins & achievements</span>
                <textarea
                  className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent min-h-[100px]"
                  value={achievements}
                  onChange={(e) => setAchievements(e.target.value)}
                  placeholder="Led migration that reduced costs 30%, mentored 3 junior engineers..."
                />
              </label>
              <Button onClick={generateRaiseScript} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Raise Script'}
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            {raiseResult && (
              <>
                <Card>
                  <h3 className="font-heading text-lg font-semibold">Market Analysis</h3>
                  <p className="mt-1 text-xs text-muted">Estimate based on role, experience, and location</p>
                  <div className="mt-4">
                    <p className="text-sm text-muted">Estimated range</p>
                    <p className="font-heading text-2xl font-bold">{raiseResult.range}</p>
                    <p className={`mt-2 text-sm font-medium capitalize ${statusColors[raiseResult.status] || 'text-muted'}`}>
                      You appear to be {raiseResult.status?.replace('_', ' ')}
                    </p>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between">
                    <h3 className="font-heading text-lg font-semibold">Negotiation Script</h3>
                    <Button variant="ghost" size="sm" onClick={copyScript} className="gap-1">
                      {copied ? <Check className="h-4 w-4 text-mint" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-text/90">{raiseResult.script}</p>
                </Card>

                <Card>
                  <h3 className="font-heading text-lg font-semibold">Talking Points</h3>
                  <ul className="mt-4 space-y-2">
                    {(raiseResult.talkingPoints || []).map((point, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="text-accent font-bold">{i + 1}.</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </Card>
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'move' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <h3 className="font-heading text-lg font-semibold">When can I afford to quit?</h3>
            <div className="mt-4 space-y-4">
              <Input
                label="Target monthly expenses if you quit ($)"
                type="number"
                value={targetExpenses}
                onChange={(e) => setTargetExpenses(e.target.value)}
              />
              <Input
                label="Target new salary ($)"
                type="number"
                value={targetSalary}
                onChange={(e) => setTargetSalary(e.target.value)}
                placeholder="90000"
              />
              <Button onClick={analyzeCareerMove} disabled={loading}>
                {loading ? 'Calculating...' : 'Calculate'}
              </Button>
            </div>
          </Card>

          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <p className="text-sm text-muted">Current runway</p>
                <p className="font-heading text-3xl font-bold">{runway.toFixed(1)} mo</p>
              </Card>
              <Card>
                <p className="text-sm text-muted">Safe savings target</p>
                <p className="font-heading text-3xl font-bold">{formatCurrency(neededSavings)}</p>
                <p className="text-xs text-muted mt-1">{recommendedRunway} months expenses</p>
              </Card>
              <Card>
                <p className="text-sm text-muted">Amount to save</p>
                <p className="font-heading text-3xl font-bold">{formatCurrency(savingsGap)}</p>
              </Card>
              <Card>
                <p className="text-sm text-muted">Months to goal</p>
                <p className="font-heading text-3xl font-bold">
                  {monthsToGoal === Infinity ? '∞' : monthsToGoal}
                </p>
                <p className="text-xs text-muted mt-1">At current surplus</p>
              </Card>
            </div>

            <AIInsight
              title="Career Move Assessment"
              content={careerMoveResult}
              loading={loading}
            />
          </div>
        </div>
      )}

      {tab === 'advisor' && (
        <div className="max-w-3xl">
          <p className="mb-4 text-sm text-muted">
            Get personalized advice on salary negotiation, side income, and career moves based on your finances.
          </p>
          <ChatBox
            messages={chatMessages}
            onSend={handleCareerChat}
            loading={chatLoading}
            placeholder="e.g. How should I negotiate a raise with my current savings?"
          />
        </div>
      )}
    </DashboardLayout>
  )
}
