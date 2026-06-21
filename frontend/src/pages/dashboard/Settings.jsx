import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { User, CreditCard } from 'lucide-react'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Card, Input, Select } from '../../components/UI'
import SubscriptionPlans from '../../components/SubscriptionPlans'
import ThemeToggle from '../../components/ThemeToggle'
import {
  supabase, getSession, getProfile, formatCurrency, monthlyIncome,
  updateProfile, deleteUserData, getAccounts, getTransactions, getGoals, getDebts,
} from '../../lib/supabase'
import { createCheckoutSession, createPortalSession, getSubscriptionStatus } from '../../lib/api'
import { CURRENCIES, getCurrencyMeta } from '../../lib/constants'
import { exportUserDataJson, exportTransactionsCsv } from '../../lib/financeUtils'
import { toastSuccess, toastError } from '../../lib/toast'

const CAREER_GOALS = [
  'Get a raise',
  'Switch jobs',
  'Pay off debt',
  'Build savings',
  'Start a business',
]

function resolveCurrentPlan(profile) {
  if (!profile) return 'free'
  if (profile.subscription_plan && profile.subscription_plan !== 'free') {
    return profile.subscription_plan
  }
  if (['active', 'trialing'].includes(profile.subscription_status)) return 'pro'
  return 'free'
}

export default function Settings() {
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState('profile')
  const [userId, setUserId] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [salary, setSalary] = useState('')
  const [payFrequency, setPayFrequency] = useState('annual')
  const [careerGoal, setCareerGoal] = useState('Pay off debt')
  const [jobTitle, setJobTitle] = useState('')
  const [yearsExp, setYearsExp] = useState('')
  const [city, setCity] = useState('')
  const [savings, setSavings] = useState('')
  const [subscriptionPlan, setSubscriptionPlan] = useState('free')
  const [stripeConfigured, setStripeConfigured] = useState(false)
  const [stripeCustomerId, setStripeCustomerId] = useState(null)
  const [currency, setCurrency] = useState('USD')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [budgetAlerts, setBudgetAlerts] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(true)

  const currencyMeta = getCurrencyMeta(currency)

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setUserId(session.user.id)
      setToken(session.access_token)
      const profile = await getProfile(session.user.id)
      if (profile) {
        setSalary(profile.salary ? String(profile.salary) : '')
        setPayFrequency(profile.pay_frequency || 'annual')
        setCareerGoal(profile.career_goal || 'Pay off debt')
        setJobTitle(profile.job_title || '')
        setYearsExp(profile.years_experience ? String(profile.years_experience) : '')
        setCity(profile.city || '')
        setSavings(profile.savings ? String(profile.savings) : '')
        setSubscriptionPlan(resolveCurrentPlan(profile))
        setStripeCustomerId(profile.stripe_customer_id)
        setCurrency(profile.currency || 'USD')
        setAvatarUrl(profile.avatar_url || '')
        setBudgetAlerts(profile.notification_prefs?.budget_alerts !== false)
        setWeeklySummary(profile.notification_prefs?.weekly_summary !== false)
      }
      try {
        const sub = await getSubscriptionStatus(session.access_token)
        setStripeConfigured(Boolean(sub.stripeConfigured))
        if (sub.plan) setSubscriptionPlan(sub.plan)
      } catch {
        setStripeConfigured(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (searchParams.get('success')) {
      setMessage('Subscription activated successfully!')
      setTab('subscription')
      const plan = searchParams.get('plan')
      if (plan === 'plus' || plan === 'pro') setSubscriptionPlan(plan)
    }
    if (searchParams.get('canceled')) {
      setMessage('Checkout was canceled.')
      setTab('subscription')
    }
  }, [searchParams])

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await updateProfile(userId, {
        salary: Number(salary) || 0,
        pay_frequency: payFrequency,
        career_goal: careerGoal,
        job_title: jobTitle,
        years_experience: Number(yearsExp) || 0,
        city,
        savings: Number(savings) || 0,
        currency,
        avatar_url: avatarUrl || null,
        notification_prefs: { budget_alerts: budgetAlerts, weekly_summary: weeklySummary },
      })
      setMessage('Profile saved.')
      toastSuccess('Profile saved')
    } catch (err) {
      setError(err.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleSelectPlan(planId) {
    if (!token || !userId || planId === 'free') return
    setLoading(true)
    try {
      const result = await createCheckoutSession(token, planId)
      if (result.preview || result.stripeConfigured === false) {
        await updateProfile(userId, { subscription_plan: planId })
        setSubscriptionPlan(planId)
        toastSuccess(`${planId === 'pro' ? 'Pro' : 'Plus'} plan selected (preview). Connect Stripe to enable billing.`)
        return
      }
      if (result.url) window.location.href = result.url
    } catch (err) {
      toastError(err.message || 'Could not start checkout')
    } finally {
      setLoading(false)
    }
  }

  async function handleManageBilling() {
    if (!token) return
    setLoading(true)
    try {
      const { url } = await createPortalSession(token)
      window.location.href = url
    } catch {
      toastError('Unable to open billing portal.')
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <DashboardLayout title="Settings" subtitle="Manage your profile and plan">
      {message && (
        <div className="mb-6 rounded-lg border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-mint">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-6 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="pb-24">
        {tab === 'profile' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="font-heading text-lg font-semibold">Your profile</h3>
              <p className="mt-1 text-sm text-muted">Changes here update your dashboard and AI advice.</p>
              <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
                <Input
                  label={`Salary (${currencyMeta.symbol})`}
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  placeholder="75000"
                />
                <Select label="Pay frequency" value={payFrequency} onChange={(e) => setPayFrequency(e.target.value)}>
                  <option value="annual">Annual</option>
                  <option value="monthly">Monthly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="weekly">Weekly</option>
                </Select>
                <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>{c.symbol} {c.label} ({c.code})</option>
                  ))}
                </Select>
                <Select label="Career goal" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)}>
                  {CAREER_GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
                </Select>
                <Input label="Job title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Software Engineer" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Years of experience" type="number" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} />
                  <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Austin, TX" />
                </div>
                <Input label={`Current savings (${currencyMeta.symbol})`} type="number" value={savings} onChange={(e) => setSavings(e.target.value)} />
                <Input label="Profile picture URL" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." />
                <p className="text-xs text-muted">
                  Estimated monthly income: {formatCurrency(monthlyIncome(Number(salary), payFrequency), currency)}
                </p>
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</Button>
              </form>
            </Card>

            <div className="space-y-6">
              <Card>
                <h3 className="font-heading text-lg font-semibold">Appearance</h3>
                <p className="mt-1 text-sm text-muted">Dark or light mode</p>
                <div className="mt-4"><ThemeToggle variant="pill" /></div>
              </Card>
              <Card>
                <h3 className="font-heading text-lg font-semibold">Notifications</h3>
                <div className="mt-4 space-y-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={budgetAlerts} onChange={(e) => setBudgetAlerts(e.target.checked)} />
                    Budget over-limit alerts
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={weeklySummary} onChange={(e) => setWeeklySummary(e.target.checked)} />
                    Weekly summary on dashboard
                  </label>
                </div>
              </Card>
              <Card>
                <h3 className="font-heading text-lg font-semibold">Data export</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={async () => {
                    if (!userId) return
                    const data = { profile: await getProfile(userId), accounts: await getAccounts(userId), transactions: await getTransactions(userId), goals: await getGoals(userId), debts: await getDebts(userId) }
                    const blob = new Blob([exportUserDataJson(data)], { type: 'application/json' })
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'upshift-export.json'; a.click()
                    toastSuccess('JSON exported')
                  }}>Export JSON</Button>
                  <Button variant="secondary" size="sm" onClick={async () => {
                    if (!userId) return
                    const tx = await getTransactions(userId)
                    const blob = new Blob([exportTransactionsCsv(tx)], { type: 'text/csv' })
                    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'upshift-transactions.csv'; a.click()
                    toastSuccess('CSV exported')
                  }}>Export CSV</Button>
                </div>
              </Card>
              <Card>
                <h3 className="font-heading text-lg font-semibold text-danger">Delete account</h3>
                <p className="mt-1 text-sm text-muted">Permanently delete your data.</p>
                <Button variant="danger" className="mt-4" onClick={async () => {
                  if (!userId || !window.confirm('Delete all your data? This cannot be undone.')) return
                  try {
                    await deleteUserData(userId)
                    toastSuccess('Account data deleted')
                    window.location.href = '/'
                  } catch (err) {
                    toastError(err.message)
                  }
                }}>Delete my data</Button>
              </Card>
            </div>
          </div>
        )}

        {tab === 'subscription' && (
          <SubscriptionPlans
            currentPlan={subscriptionPlan}
            loading={loading}
            stripeConfigured={stripeConfigured}
            onSelectPlan={handleSelectPlan}
            onManageBilling={handleManageBilling}
            hasStripeCustomer={Boolean(stripeCustomerId)}
          />
        )}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md lg:left-64">
        <div className="mx-auto flex max-w-lg">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                tab === id ? 'text-accent' : 'text-muted hover:text-text'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </DashboardLayout>
  )
}
