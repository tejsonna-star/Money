import { useState, useEffect } from 'react'
import { Trash2, Plus } from 'lucide-react'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Input, Select, PageSection } from '../../components/UI'
import {
  getSession,
  getTransactions,
  addTransaction,
  deleteTransaction,
  EXPENSE_CATEGORIES,
  formatCurrency,
  formatDate,
} from '../../lib/supabase'
import { toastSuccess, toastError } from '../../lib/toast'

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Bonus', 'Investment', 'Other']

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    amount: '',
    category: 'Food',
    type: 'expense',
    transaction_date: new Date().toISOString().slice(0, 10),
    note: '',
  })

  async function load() {
    const session = await getSession()
    if (!session) return
    setUserId(session.user.id)
    const data = await getTransactions(session.user.id)
    setTransactions(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!userId || !form.amount) return
    try {
      await addTransaction(userId, {
        amount: Number(form.amount),
        category: form.category,
        type: form.type,
        transaction_date: form.transaction_date,
        note: form.note || null,
      })
      toastSuccess('Transaction added')
      setForm({
        amount: '',
        category: form.type === 'income' ? 'Salary' : 'Food',
        type: form.type,
        transaction_date: new Date().toISOString().slice(0, 10),
        note: '',
      })
      setShowForm(false)
      await load()
    } catch (err) {
      toastError(err.message || 'Failed to add transaction')
    }
  }

  async function handleDelete(id) {
    try {
      await deleteTransaction(id)
      toastSuccess('Transaction deleted')
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      toastError(err.message || 'Failed to delete')
    }
  }

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <DashboardLayout title="Transactions" subtitle="Log income and expenses">
      <PageSection
        title="Transaction history"
        action={
          <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancel' : 'Add transaction'}
          </Button>
        }
      >
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
            <Select
              label="Type"
              value={form.type}
              onChange={(e) => setForm({
                ...form,
                type: e.target.value,
                category: e.target.value === 'income' ? 'Salary' : 'Food',
              })}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </Select>
            <Input
              label="Amount ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <Select
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
            <Input
              label="Date"
              type="date"
              value={form.transaction_date}
              onChange={(e) => setForm({ ...form, transaction_date: e.target.value })}
            />
            <div className="sm:col-span-2">
              <Input
                label="Note (optional)"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Coffee with client, paycheck, etc."
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Save transaction</Button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-sm text-muted">Loading transactions...</p>
        ) : !transactions.length ? (
          <p className="text-sm text-muted">No transactions yet. Add your first one above.</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{t.category}</span>
                    <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-muted capitalize">
                      {t.type}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(t.transaction_date)}
                    {t.note ? ` · ${t.note}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-heading text-lg font-semibold ${t.type === 'income' ? 'text-mint' : 'text-text'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(t.id)}
                    className="rounded-lg p-2 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    aria-label="Delete transaction"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageSection>
    </DashboardLayout>
  )
}
