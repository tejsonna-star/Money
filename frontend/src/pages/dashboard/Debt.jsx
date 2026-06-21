import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Input, Card } from '../../components/UI'
import AIInsight from '../../components/AIInsight'
import { getSession, getDebts, formatCurrency } from '../../lib/supabase'
import { calculateDebtPayoff, callAI } from '../../lib/api'

const emptyDebt = () => ({ name: '', balance: '', interest_rate: '', minimum_payment: '' })

function StrategyCard({ title, subtitle, result, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-heading text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted">Months to debt-free</p>
          <p className="font-heading text-2xl font-bold">{result.months}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Total interest paid</p>
          <p className="font-heading text-2xl font-bold">{formatCurrency(result.totalInterest)}</p>
        </div>
      </div>
      {result.schedule.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-sm text-accent hover:underline"
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {open ? 'Hide' : 'Show'} month-by-month schedule
          </button>
          {open && (
            <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-border text-left text-muted">
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2">Interest</th>
                    <th className="px-3 py-2">Principal</th>
                    <th className="px-3 py-2">Remaining</th>
                  </tr>
                </thead>
                <tbody>
                  {result.schedule.map((row) => (
                    <tr key={row.month} className="border-b border-border/50">
                      <td className="px-3 py-2">{row.month}</td>
                      <td className="px-3 py-2">{formatCurrency(row.interest)}</td>
                      <td className="px-3 py-2">{formatCurrency(row.principal)}</td>
                      <td className="px-3 py-2">{formatCurrency(row.remaining)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default function Debt() {
  const [debts, setDebts] = useState([])
  const [userId, setUserId] = useState(null)
  const [token, setToken] = useState(null)
  const [extraPayment, setExtraPayment] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyDebt())
  const [aiAdvice, setAiAdvice] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setUserId(session.user.id)
      setToken(session.access_token)
      setDebts(await getDebts(session.user.id))
    }
    load()
  }, [])

  const avalanche = calculateDebtPayoff(debts, Number(extraPayment), 'avalanche')
  const snowball = calculateDebtPayoff(debts, Number(extraPayment), 'snowball')
  const totalDebt = debts.reduce((s, d) => s + Number(d.balance), 0)

  async function handleAdd(e) {
    e.preventDefault()
    if (!userId) return
    const { supabase } = await import('../../lib/supabase')
    const { data } = await supabase.from('debts').insert({
      user_id: userId,
      name: form.name,
      balance: Number(form.balance),
      interest_rate: Number(form.interest_rate),
      minimum_payment: Number(form.minimum_payment),
    }).select().single()
    if (data) {
      setDebts((prev) => [...prev, data])
      setForm(emptyDebt())
      setShowForm(false)
    }
  }

  async function handleDelete(id) {
    const { supabase } = await import('../../lib/supabase')
    await supabase.from('debts').delete().eq('id', id)
    setDebts((prev) => prev.filter((d) => d.id !== id))
  }

  async function askAI() {
    if (!token) return
    setAiLoading(true)
    try {
      const result = await callAI('debt_advice', {
        debts,
        avalanche,
        snowball,
        extraPayment: Number(extraPayment),
      }, token)
      setAiAdvice(result)
    } catch {
      setAiAdvice(
        avalanche.months <= snowball.months
          ? `Avalanche saves you ${formatCurrency(snowball.totalInterest - avalanche.totalInterest)} in interest compared to snowball. Prioritize your highest-rate debt first.`
          : `Snowball gets you debt-free in ${snowball.months} months with smaller wins along the way. Avalanche takes ${avalanche.months} months but saves more on interest.`
      )
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <DashboardLayout title="Debt Tracker" subtitle="Compare payoff strategies and crush your debt">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-muted">
          Total debt: <span className="font-semibold text-text">{formatCurrency(totalDebt)}</span>
        </p>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1">
          <Plus className="h-4 w-4" /> Add debt
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 rounded-xl border border-border bg-card p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Balance" type="number" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} required />
            <Input label="Interest rate (%)" type="number" value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} />
            <Input label="Min. payment" type="number" value={form.minimum_payment} onChange={(e) => setForm({ ...form, minimum_payment: e.target.value })} />
          </div>
          <div className="mt-4 flex gap-2">
            <Button type="submit" size="sm">Save</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="mb-6 space-y-3">
        {debts.map((debt) => (
          <div key={debt.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
            <div>
              <p className="font-medium">{debt.name}</p>
              <p className="text-sm text-muted">
                {formatCurrency(debt.balance)} · {debt.interest_rate}% APR · Min {formatCurrency(debt.minimum_payment)}/mo
              </p>
            </div>
            <button onClick={() => handleDelete(debt.id)} className="text-muted hover:text-danger">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {!debts.length && (
          <p className="text-center text-sm text-muted py-8">No debts added yet. Add your first debt above.</p>
        )}
      </div>

      {debts.length > 0 && (
        <>
          <div className="mb-6">
            <Input
              label="Extra monthly payment ($)"
              type="number"
              value={extraPayment}
              onChange={(e) => setExtraPayment(e.target.value)}
              placeholder="0"
              className="max-w-xs"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <StrategyCard
              title="Avalanche"
              subtitle="Highest interest first — saves the most money"
              result={avalanche}
              defaultOpen
            />
            <StrategyCard
              title="Snowball"
              subtitle="Smallest balance first — most motivating"
              result={snowball}
            />
          </div>

          <div className="mt-6">
            <AIInsight
              title="AI Debt Recommendation"
              content={aiAdvice}
              loading={aiLoading}
              onAction={askAI}
              actionLabel="Ask AI"
            />
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
