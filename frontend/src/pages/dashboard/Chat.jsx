import { useState, useEffect } from 'react'
import { DashboardLayout } from '../../components/Sidebar'
import ChatBox from '../../components/ChatBox'
import {
  getSession,
  getProfile,
  getDebts,
  getExpenses,
  monthlyIncome,
  formatCurrency,
} from '../../lib/supabase'
import { sendChatMessage } from '../../lib/api'
import PlanGate from '../../components/PlanGate'
import { FEATURES } from '../../lib/planGating'
import { usePlan } from '../../context/PlanContext'

export default function Chat() {
  const { hasFeature } = usePlan()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState(null)
  const [context, setContext] = useState({})

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setToken(session.access_token)

      const [profile, debts, expenses] = await Promise.all([
        getProfile(session.user.id),
        getDebts(session.user.id),
        getExpenses(session.user.id),
      ])

      const income = monthlyIncome(profile?.salary, profile?.pay_frequency)
      const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
      const totalDebt = debts.reduce((s, d) => s + Number(d.balance), 0)

      setContext({
        careerGoal: profile?.career_goal,
        salary: profile?.salary,
        monthlyIncome: income,
        monthlyExpenses: totalExpenses,
        cashFlow: income - totalExpenses,
        totalDebt,
        savings: profile?.savings,
        debtCount: debts.length,
        jobTitle: profile?.job_title,
        city: profile?.city,
      })

      setMessages([{
        role: 'assistant',
        content: `Hi — I'm your Upshift advisor. You're working toward: ${profile?.career_goal || 'your financial goals'}. Monthly income ~${formatCurrency(income)}, expenses ~${formatCurrency(totalExpenses)}. What do you want to tackle today?`,
      }])
    }
    load()
  }, [])

  async function handleSend(text) {
    if (!token || !hasFeature(FEATURES.AI_CHAT)) return
    const userMsg = { role: 'user', content: text }
    const nextHistory = [...messages, userMsg]
    setMessages(nextHistory)
    setLoading(true)
    try {
      const reply = await sendChatMessage(
        text,
        messages.filter((m) => m.role === 'user' || m.role === 'assistant'),
        context,
        token
      )
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, stream: true }])
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: err.message || 'Something went wrong. Check GEMINI_API_KEY on Vercel and redeploy.',
        stream: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout title="AI Chat" subtitle="Ask questions about your finances and career">
      <PlanGate feature={FEATURES.AI_CHAT} title="Unlimited AI chat requires Pro">
        <ChatBox messages={messages} onSend={handleSend} loading={loading} />
      </PlanGate>
    </DashboardLayout>
  )
}
