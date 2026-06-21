import { useState, useEffect, useMemo } from 'react'
import { Trash2, Plus, Download, Split } from 'lucide-react'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Input, Select, PageSection } from '../../components/UI'
import { CategoryBadge } from '../../lib/categories.jsx'
import {
  getSession, getTransactions, addTransaction, addTransactionWithSplits,
  deleteTransaction, processRecurringTransactions, recordActivity, updateProfile,
  EXPENSE_CATEGORIES, formatCurrency, formatDate,
} from '../../lib/supabase'
import { exportTransactionsCsv } from '../../lib/financeUtils'
import { FEATURES } from '../../lib/planGating'
import PlanGate, { PlanLockIcon } from '../../components/PlanGate'
import { usePlan } from '../../context/PlanContext'
import { toastSuccess, toastError } from '../../lib/toast'

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Bonus', 'Investment', 'Other']

export default function Transactions() {
  const { hasFeature } = usePlan()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showSplit, setShowSplit] = useState(false)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [form, setForm] = useState({
    amount: '', category: 'Food', type: 'expense',
    transaction_date: new Date().toISOString().slice(0, 10),
    note: '', is_recurring: false, recurring_frequency: 'monthly',
  })
  const [splits, setSplits] = useState([{ category: 'Food', amount: '' }, { category: 'Household', amount: '' }])

  async function load() {
    const session = await getSession()
    if (!session) return
    setUserId(session.user.id)
    await processRecurringTransactions(session.user.id)
    await recordActivity(session.user.id)
    const data = await getTransactions(session.user.id)
    setTransactions(data.filter((t) => !t.parent_id))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (filterType !== 'all' && t.type !== filterType) return false
      if (filterCategory !== 'all' && t.category !== filterCategory) return false
      if (search) {
        const q = search.toLowerCase()
        return t.category.toLowerCase().includes(q) || (t.note || '').toLowerCase().includes(q) || String(t.amount).includes(q)
      }
      return true
    })
  }, [transactions, search, filterType, filterCategory])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!userId || !form.amount) return
    try {
      const recurring = hasFeature(FEATURES.RECURRING_TRANSACTIONS) && form.is_recurring
      if (showSplit && splits.length >= 2) {
        await addTransactionWithSplits(userId, {
          amount: Number(form.amount), category: 'Split', type: form.type,
          transaction_date: form.transaction_date, note: form.note || 'Split transaction',
          is_recurring: recurring, recurring_frequency: recurring ? form.recurring_frequency : null,
        }, splits.filter((s) => s.amount))
      } else {
        await addTransaction(userId, {
          amount: Number(form.amount), category: form.category, type: form.type,
          transaction_date: form.transaction_date, note: form.note || null,
          is_recurring: recurring, recurring_frequency: recurring ? form.recurring_frequency : null,
        })
      }
      await updateProfile(userId, { onboarding_checklist: { transaction: true } })
      toastSuccess('Transaction added')
      setShowForm(false)
      setShowSplit(false)
      await load()
    } catch (err) {
      toastError(err.message)
    }
  }

  function exportCsv() {
    if (!hasFeature(FEATURES.CSV_EXPORT)) return
    const csv = exportTransactionsCsv(transactions)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'upshift-transactions.csv'
    a.click()
    toastSuccess('CSV exported')
  }

  async function handleDelete(id) {
    try {
      await deleteTransaction(id)
      toastSuccess('Transaction deleted')
      setTransactions((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      toastError(err.message)
    }
  }

  const categories = form.type === 'income' ? INCOME_CATEGORIES : [...EXPENSE_CATEGORIES, 'Household']

  return (
    <DashboardLayout title="Transactions" subtitle="Log, search, and export income and expenses">
      <PageSection
        title="Transaction history"
        action={
          <div className="flex flex-wrap gap-2">
            <PlanGate feature={FEATURES.CSV_EXPORT} title="CSV export requires Plus" className="inline-block">
              <Button size="sm" variant="secondary" className="gap-1" onClick={exportCsv}><Download className="h-4 w-4" />Export CSV</Button>
            </PlanGate>
            <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" />{showForm ? 'Cancel' : 'Add'}</Button>
          </div>
        }
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All types</option>
            <option value="expense">Expenses</option>
            <option value="income">Income</option>
          </Select>
          <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
            <option value="all">All categories</option>
            {[...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-xl border border-border bg-surface p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: e.target.value === 'income' ? 'Salary' : 'Food' })}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </Select>
              <Input label="Amount ($)" type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
              {!showSplit && (
                <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              )}
              <Input label="Date" type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
              <Input label="Note" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="sm:col-span-2" />
            </div>
            <label className={`flex items-center gap-2 text-sm ${!hasFeature(FEATURES.RECURRING_TRANSACTIONS) ? 'opacity-60' : ''}`}>
              <input
                type="checkbox"
                checked={form.is_recurring}
                disabled={!hasFeature(FEATURES.RECURRING_TRANSACTIONS)}
                onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
              />
              Recurring transaction
              {!hasFeature(FEATURES.RECURRING_TRANSACTIONS) && <PlanLockIcon feature={FEATURES.RECURRING_TRANSACTIONS} />}
            </label>
            {form.is_recurring && hasFeature(FEATURES.RECURRING_TRANSACTIONS) && (
              <Select label="Frequency" value={form.recurring_frequency} onChange={(e) => setForm({ ...form, recurring_frequency: e.target.value })}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            )}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" className="gap-1" onClick={() => setShowSplit(!showSplit)}>
                <Split className="h-4 w-4" />{showSplit ? 'Single category' : 'Split transaction'}
              </Button>
              <Button type="submit">Save</Button>
            </div>
            {showSplit && (
              <div className="space-y-2 border-t border-border pt-4">
                <p className="text-sm text-muted">Split total across categories:</p>
                {splits.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <Select value={s.category} onChange={(e) => { const n = [...splits]; n[i].category = e.target.value; setSplits(n) }}>
                      {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      <option value="Household">Household</option>
                    </Select>
                    <Input type="number" placeholder="Amount" value={s.amount} onChange={(e) => { const n = [...splits]; n[i].amount = e.target.value; setSplits(n) }} />
                  </div>
                ))}
              </div>
            )}
          </form>
        )}

        {loading ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : !filtered.length ? (
          <p className="text-sm text-muted">No transactions match your filters.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge category={t.category === 'Split' ? 'Other' : t.category} />
                    {t.is_recurring && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">↻ {t.recurring_frequency}</span>}
                  </div>
                  <p className="mt-1 text-xs text-muted">{formatDate(t.transaction_date)}{t.note ? ` · ${t.note}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-heading text-lg font-semibold ${t.type === 'income' ? 'text-mint' : 'text-text'}`}>
                    {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                  </span>
                  <button type="button" onClick={() => handleDelete(t.id)} className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger">
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
