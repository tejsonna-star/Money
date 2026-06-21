import { useState, useEffect } from 'react'
import { Plus, Trash2, Shield } from 'lucide-react'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Input, Select, PageSection, ProgressBar } from '../../components/UI'
import {
  getSession, getProfile, getGoals, getTransactions, getExpenses,
  addGoal, updateGoal, deleteGoal, monthlyIncome, formatCurrency, formatDate, updateProfile,
} from '../../lib/supabase'
import { GOAL_CATEGORIES } from '../../lib/constants'
import { calculateRoundUpSavings, projectGoalCompletion } from '../../lib/financeUtils'
import { toastSuccess, toastError } from '../../lib/toast'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [userId, setUserId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '0', deadline: '', category: 'general' })

  async function load() {
    const session = await getSession()
    if (!session) return
    setUserId(session.user.id)
    const [g, p, tx] = await Promise.all([
      getGoals(session.user.id), getProfile(session.user.id), getTransactions(session.user.id),
    ])
    setGoals(g)
    setProfile(p)
    setTransactions(tx)
  }

  useEffect(() => { load() }, [])

  const roundUpMonthly = calculateRoundUpSavings(transactions)
  const monthlyExpenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const emergencyRecommended = monthlyExpenses * 6
  const income = monthlyIncome(profile?.salary, profile?.pay_frequency)
  const monthlySurplus = income - monthlyExpenses

  async function handleCreate(e) {
    e.preventDefault()
    if (!userId || !form.name || !form.target_amount) return
    try {
      await addGoal(userId, {
        name: form.name, target_amount: Number(form.target_amount),
        current_amount: Number(form.current_amount) || 0,
        deadline: form.deadline || null, category: form.category,
      })
      await updateProfile(userId, { onboarding_checklist: { ...(profile?.onboarding_checklist || {}), goal: true } })
      toastSuccess('Goal created')
      setShowForm(false)
      await load()
    } catch (err) {
      toastError(err.message)
    }
  }

  async function createEmergencyFund() {
    if (!userId) return
    try {
      await addGoal(userId, {
        name: 'Emergency fund', target_amount: emergencyRecommended,
        current_amount: Number(profile?.savings) || 0, category: 'emergency', deadline: null,
      })
      toastSuccess('Emergency fund goal created')
      await load()
    } catch (err) {
      toastError(err.message)
    }
  }

  async function handleUpdateAmount(goal, delta) {
    try {
      const next = Math.max(0, Number(goal.current_amount) + delta)
      await updateGoal(goal.id, { current_amount: next })
      toastSuccess('Goal updated')
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, current_amount: next } : g)))
    } catch (err) {
      toastError(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteGoal(id)
      toastSuccess('Goal deleted')
      setGoals((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      toastError(err.message)
    }
  }

  const catLabel = Object.fromEntries(GOAL_CATEGORIES.map((c) => [c.id, c.label]))

  return (
    <DashboardLayout title="Goals" subtitle="Track savings goals with projections">
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <PageSection title="Round-up savings">
          <p className="text-sm text-muted">If you round up every expense to the nearest dollar:</p>
          <p className="mt-2 font-heading text-2xl font-bold text-mint">{formatCurrency(roundUpMonthly)}/mo</p>
        </PageSection>
        <PageSection title="Emergency fund">
          <p className="text-sm text-muted">Recommended (6 months expenses):</p>
          <p className="mt-2 font-heading text-2xl font-bold">{formatCurrency(emergencyRecommended)}</p>
          <Button size="sm" className="mt-3 gap-1" onClick={createEmergencyFund}><Shield className="h-4 w-4" />Create goal</Button>
        </PageSection>
      </div>

      <PageSection
        title="Your goals"
        action={<Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" />{showForm ? 'Cancel' : 'New goal'}</Button>}
      >
        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
            <Input label="Goal name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {GOAL_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </Select>
            <Input label="Target ($)" type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required />
            <Input label="Current saved ($)" type="number" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} />
            <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
            <div className="sm:col-span-2"><Button type="submit">Create goal</Button></div>
          </form>
        )}

        {!goals.length ? (
          <p className="text-sm text-muted">No goals yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((goal) => {
              const target = Number(goal.target_amount)
              const current = Number(goal.current_amount)
              const pct = target > 0 ? (current / target) * 100 : 0
              const projection = projectGoalCompletion(goal, monthlySurplus)

              return (
                <div key={goal.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs text-muted">{catLabel[goal.category] || goal.category}</span>
                      <h4 className="font-heading font-semibold">{goal.name}</h4>
                      {goal.deadline && <p className="text-xs text-muted">Due {formatDate(goal.deadline)}</p>}
                      {projection.months !== Infinity && projection.months > 0 && (
                        <p className="mt-1 text-xs text-accent">~{projection.months} mo to complete at current rate</p>
                      )}
                    </div>
                    <button type="button" onClick={() => handleDelete(goal.id)} className="text-muted hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <p className="mt-3 font-heading text-2xl font-bold">{formatCurrency(current)} <span className="text-base font-normal text-muted">/ {formatCurrency(target)}</span></p>
                  <ProgressBar value={pct} colorClass="bg-mint" className="mt-3" />
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleUpdateAmount(goal, 100)}>+$100</Button>
                    <Button size="sm" variant="secondary" onClick={() => handleUpdateAmount(goal, 500)}>+$500</Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PageSection>
    </DashboardLayout>
  )
}
