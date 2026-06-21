import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Input, PageSection, ProgressBar } from '../../components/UI'
import {
  getSession,
  getGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  formatCurrency,
  formatDate,
} from '../../lib/supabase'
import { toastSuccess, toastError } from '../../lib/toast'

export default function Goals() {
  const [goals, setGoals] = useState([])
  const [userId, setUserId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    deadline: '',
  })

  async function load() {
    const session = await getSession()
    if (!session) return
    setUserId(session.user.id)
    setGoals(await getGoals(session.user.id))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!userId || !form.name || !form.target_amount) return
    try {
      await addGoal(userId, {
        name: form.name,
        target_amount: Number(form.target_amount),
        current_amount: Number(form.current_amount) || 0,
        deadline: form.deadline || null,
      })
      toastSuccess('Goal created')
      setForm({ name: '', target_amount: '', current_amount: '0', deadline: '' })
      setShowForm(false)
      await load()
    } catch (err) {
      toastError(err.message || 'Failed to create goal')
    }
  }

  async function handleUpdateAmount(goal, delta) {
    try {
      const next = Math.max(0, Number(goal.current_amount) + delta)
      await updateGoal(goal.id, { current_amount: next })
      toastSuccess('Goal updated')
      setGoals((prev) => prev.map((g) => (g.id === goal.id ? { ...g, current_amount: next } : g)))
    } catch (err) {
      toastError(err.message || 'Failed to update goal')
    }
  }

  async function handleDelete(id) {
    try {
      await deleteGoal(id)
      toastSuccess('Goal deleted')
      setGoals((prev) => prev.filter((g) => g.id !== id))
    } catch (err) {
      toastError(err.message || 'Failed to delete goal')
    }
  }

  return (
    <DashboardLayout title="Goals" subtitle="Track savings goals and deadlines">
      <PageSection
        title="Your goals"
        action={
          <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancel' : 'New goal'}
          </Button>
        }
      >
        {showForm && (
          <form onSubmit={handleCreate} className="mb-6 grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
            <Input
              label="Goal name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Emergency fund"
              required
            />
            <Input
              label="Target amount ($)"
              type="number"
              min="1"
              value={form.target_amount}
              onChange={(e) => setForm({ ...form, target_amount: e.target.value })}
              required
            />
            <Input
              label="Current saved ($)"
              type="number"
              min="0"
              value={form.current_amount}
              onChange={(e) => setForm({ ...form, current_amount: e.target.value })}
            />
            <Input
              label="Deadline (optional)"
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Button type="submit">Create goal</Button>
            </div>
          </form>
        )}

        {!goals.length ? (
          <p className="text-sm text-muted">No goals yet. Create one to start tracking progress.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map((goal) => {
              const target = Number(goal.target_amount)
              const current = Number(goal.current_amount)
              const pct = target > 0 ? (current / target) * 100 : 0

              return (
                <div key={goal.id} className="rounded-xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-heading font-semibold">{goal.name}</h4>
                      {goal.deadline && (
                        <p className="mt-0.5 text-xs text-muted">Due {formatDate(goal.deadline)}</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(goal.id)}
                      className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                      aria-label="Delete goal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-3 font-heading text-2xl font-bold">
                    {formatCurrency(current)}
                    <span className="text-base font-normal text-muted"> / {formatCurrency(target)}</span>
                  </p>
                  <div className="mt-3">
                    <ProgressBar value={pct} colorClass="bg-mint" />
                    <p className="mt-1 text-xs text-muted">{pct.toFixed(0)}% complete</p>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => handleUpdateAmount(goal, 100)}>
                      +$100
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleUpdateAmount(goal, 500)}>
                      +$500
                    </Button>
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
