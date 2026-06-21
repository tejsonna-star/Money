import { useState, useEffect } from 'react'
import { Plus, Trash2, Building2 } from 'lucide-react'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Input, Select, PageSection, StatCard } from '../../components/UI'
import { getSession, getAccounts, addAccount, deleteAccount,
  getDebts, formatCurrency, updateProfile, getProfile,
} from '../../lib/supabase'
import { ACCOUNT_TYPES } from '../../lib/constants'
import { computeNetWorthFromAccounts } from '../../lib/financeUtils'
import { toastSuccess, toastError } from '../../lib/toast'

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [debts, setDebts] = useState([])
  const [userId, setUserId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'checking', balance: '', institution: '' })

  async function load() {
    const session = await getSession()
    if (!session) return
    setUserId(session.user.id)
    const [accts, d] = await Promise.all([getAccounts(session.user.id), getDebts(session.user.id)])
    setAccounts(accts)
    setDebts(d)
  }

  useEffect(() => { load() }, [])

  const netWorth = computeNetWorthFromAccounts(accounts, debts)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!userId) return
    try {
      await addAccount(userId, {
        name: form.name,
        type: form.type,
        balance: Number(form.balance) || 0,
        institution: form.institution || null,
      })
      await updateProfile(userId, { onboarding_checklist: { ...(await getProfile(userId))?.onboarding_checklist, account: true } })
      toastSuccess('Account added')
      setForm({ name: '', type: 'checking', balance: '', institution: '' })
      setShowForm(false)
      await load()
    } catch (err) {
      toastError(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAccount(id)
      toastSuccess('Account removed')
      setAccounts((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      toastError(err.message)
    }
  }

  const typeLabel = Object.fromEntries(ACCOUNT_TYPES.map((t) => [t.id, t.label]))

  return (
    <DashboardLayout title="Accounts" subtitle="Track bank accounts, cards, investments, and assets">
      <StatCard label="Net worth (from accounts)" value={formatCurrency(netWorth)} sub={`${accounts.length} accounts`} />

      <PageSection
        title="Your accounts"
        className="mt-6"
        action={
          <Button size="sm" className="gap-1" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancel' : 'Add account'}
          </Button>
        }
      >
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 grid gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2">
            <Input label="Account name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Chase Checking" />
            <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {ACCOUNT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
            <Input label="Balance" type="number" step="0.01" value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} required />
            <Input label="Institution" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="Chase, Fidelity..." />
            <div className="sm:col-span-2"><Button type="submit">Save account</Button></div>
          </form>
        )}

        {!accounts.length ? (
          <p className="text-sm text-muted">No accounts yet. Add checking, savings, credit cards, or investments.</p>
        ) : (
          <div className="space-y-2">
            {accounts.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accent/10 p-2"><Building2 className="h-4 w-4 text-accent" /></div>
                  <div>
                    <p className="font-medium">{a.name}</p>
                    <p className="text-xs text-muted">{typeLabel[a.type]}{a.institution ? ` · ${a.institution}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-heading text-lg font-semibold ${a.type === 'credit' ? 'text-danger' : 'text-text'}`}>
                    {a.type === 'credit' ? '-' : ''}{formatCurrency(a.balance)}
                  </span>
                  <button type="button" onClick={() => handleDelete(a.id)} className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger">
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
