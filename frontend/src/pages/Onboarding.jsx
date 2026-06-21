import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronRight, ChevronLeft } from 'lucide-react'
import { supabase, getSession } from '../lib/supabase'
import { Logo, Button, Input, Select } from '../components/UI'

const CAREER_GOALS = [
  'Get a raise',
  'Switch jobs',
  'Pay off debt',
  'Build savings',
  'Start a business',
]

const EXPENSE_CATEGORIES = [
  'Rent',
  'Food',
  'Transportation',
  'Subscriptions',
  'Utilities',
  'Insurance',
  'Entertainment',
  'Other',
]

const emptyDebt = () => ({ name: '', balance: '', interest_rate: '', minimum_payment: '' })

export default function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState(null)

  const [salary, setSalary] = useState('')
  const [payFrequency, setPayFrequency] = useState('annual')
  const [debts, setDebts] = useState([emptyDebt()])
  const [expenses, setExpenses] = useState(
    EXPENSE_CATEGORIES.map((cat) => ({ category: cat, amount: '' }))
  )
  const [careerGoal, setCareerGoal] = useState('Pay off debt')

  useEffect(() => {
    getSession().then((session) => {
      if (!session) navigate('/login')
      else setUserId(session.user.id)
    })
  }, [navigate])

  function updateDebt(i, field, value) {
    setDebts((prev) => prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d)))
  }

  function updateExpense(i, value) {
    setExpenses((prev) => prev.map((e, idx) => (idx === i ? { ...e, amount: value } : e)))
  }

  async function handleComplete() {
    if (!userId) return
    setLoading(true)
    try {
      await supabase.from('profiles').upsert({
        id: userId,
        salary: Number(salary) || 0,
        pay_frequency: payFrequency,
        career_goal: careerGoal,
        onboarding_complete: true,
      })

      const validDebts = debts.filter((d) => d.name && d.balance)
      if (validDebts.length) {
        await supabase.from('debts').insert(
          validDebts.map((d) => ({
            user_id: userId,
            name: d.name,
            balance: Number(d.balance),
            interest_rate: Number(d.interest_rate) || 0,
            minimum_payment: Number(d.minimum_payment) || 0,
          }))
        )
      }

      const validExpenses = expenses.filter((e) => e.amount)
      if (validExpenses.length) {
        await supabase.from('expenses').insert(
          validExpenses.map((e) => ({
            user_id: userId,
            category: e.category,
            amount: Number(e.amount),
          }))
        )
      }

      navigate('/dashboard')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    {
      title: 'Your income',
      subtitle: 'Step 1 of 4',
      content: (
        <div className="space-y-4">
          <Input
            label="What's your current salary?"
            type="number"
            value={salary}
            onChange={(e) => setSalary(e.target.value)}
            placeholder="75000"
          />
          <Select
            label="How often do you get paid?"
            value={payFrequency}
            onChange={(e) => setPayFrequency(e.target.value)}
          >
            <option value="annual">Annual salary</option>
            <option value="monthly">Monthly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="weekly">Weekly</option>
          </Select>
        </div>
      ),
    },
    {
      title: 'Your debts',
      subtitle: 'Step 2 of 4',
      content: (
        <div className="space-y-4">
          {debts.map((debt, i) => (
            <div key={i} className="rounded-lg border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium">Debt {i + 1}</span>
                {debts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDebts((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-muted hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={debt.name}
                  onChange={(e) => updateDebt(i, 'name', e.target.value)}
                  placeholder="Credit card"
                />
                <Input
                  label="Balance ($)"
                  type="number"
                  value={debt.balance}
                  onChange={(e) => updateDebt(i, 'balance', e.target.value)}
                  placeholder="5000"
                />
                <Input
                  label="Interest rate (%)"
                  type="number"
                  value={debt.interest_rate}
                  onChange={(e) => updateDebt(i, 'interest_rate', e.target.value)}
                  placeholder="22.5"
                />
                <Input
                  label="Min. payment ($)"
                  type="number"
                  value={debt.minimum_payment}
                  onChange={(e) => updateDebt(i, 'minimum_payment', e.target.value)}
                  placeholder="150"
                />
              </div>
            </div>
          ))}
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => setDebts((prev) => [...prev, emptyDebt()])}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add another debt
          </Button>
        </div>
      ),
    },
    {
      title: 'Monthly expenses',
      subtitle: 'Step 3 of 4',
      content: (
        <div className="grid gap-3 sm:grid-cols-2">
          {expenses.map((exp, i) => (
            <Input
              key={exp.category}
              label={exp.category}
              type="number"
              value={exp.amount}
              onChange={(e) => updateExpense(i, e.target.value)}
              placeholder="0"
            />
          ))}
        </div>
      ),
    },
    {
      title: 'Your career goal',
      subtitle: 'Step 4 of 4',
      content: (
        <Select
          label="What are you working toward?"
          value={careerGoal}
          onChange={(e) => setCareerGoal(e.target.value)}
        >
          {CAREER_GOALS.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </Select>
      ),
    },
  ]

  const current = steps[step - 1]

  return (
    <div className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8 text-center">
          <Logo size="lg" />
        </div>

        <div className="mb-8 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-accent' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-8">
          <p className="text-sm text-muted">{current.subtitle}</p>
          <h1 className="mt-1 font-heading text-2xl font-bold">{current.title}</h1>
          <div className="mt-6">{current.content}</div>

          <div className="mt-8 flex justify-between">
            {step > 1 ? (
              <Button variant="ghost" onClick={() => setStep(step - 1)} className="gap-1">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            ) : (
              <div />
            )}
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} className="gap-1">
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={loading}>
                {loading ? 'Saving...' : 'Go to Dashboard'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
