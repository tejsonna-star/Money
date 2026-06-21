import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Card, Input, Select } from '../../components/UI'
import { supabase, getSession, getProfile, formatCurrency, monthlyIncome, updateProfile, deleteUserData, getAccounts, getTransactions, getGoals, getDebts, getExpenses } from '../../lib/supabase'
import { createCheckoutSession, createPortalSession } from '../../lib/api'
import { CURRENCIES } from '../../lib/constants'
import { exportUserDataJson, exportTransactionsCsv } from '../../lib/financeUtils'
import { toastSuccess, toastError } from '../../lib/toast'
import ThemeToggle from '../../components/ThemeToggle'

const CAREER_GOALS = [
  'Get a raise',
  'Switch jobs',
  'Pay off debt',
  'Build savings',
  'Start a business',
]

export default function Settings() {
  const [searchParams] = useSearchParams()
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
  const [subscriptionStatus, setSubscriptionStatus] = useState('free')
  const [stripeCustomerId, setStripeCustomerId] = useState(null)
  const [currency, setCurrency] = useState('USD')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [budgetAlerts, setBudgetAlerts] = useState(true)
  const [weeklySummary, setWeeklySummary] = useState(true)

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
        setSubscriptionStatus(profile.subscription_status || 'free')
        setStripeCustomerId(profile.stripe_customer_id)
        setCurrency(profile.currency || 'USD')
        setAvatarUrl(profile.avatar_url || '')
        setBudgetAlerts(profile.notification_prefs?.budget_alerts !== false)
        setWeeklySummary(profile.notification_prefs?.weekly_summary !== false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (searchParams.get('success')) setMessage('Subscription activated successfully!')
    if (searchParams.get('canceled')) setMessage('Checkout was canceled.')
  }, [searchParams])

  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!userId) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = {
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
      }
      const { error: updateError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)
      if (updateError) throw updateError
      setMessage('Profile saved.')
      toastSuccess('Profile saved')
    } catch (err) {
      setError(err.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleSubscribe() {
    if (!token) return
    setLoading(true)
    try {
      const { url } = await createCheckoutSession(token)
      window.location.href = url
    } catch {
      setMessage('Stripe is not configured. Set STRIPE_SECRET_KEY to enable subscriptions.')
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
      setMessage('Unable to open billing portal. Check Stripe configuration.')
    } finally {
      setLoading(false)
    }
  }

  const statusLabel = {
    free: 'Free',
    trialing: 'Free Trial',
    active: 'Pro',
    canceled: 'Canceled',
    past_due: 'Past Due',
  }

  return (
    <DashboardLayout title="Settings" subtitle="Update your profile or manage subscription">
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-heading text-lg font-semibold">Your profile</h3>
          <p className="mt-1 text-sm text-muted">Changes here update your dashboard and AI advice.</p>
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
            <Input
              label="Salary ($)"
              type="number"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              placeholder="75000"
            />
            <Select
              label="Pay frequency"
              value={payFrequency}
              onChange={(e) => setPayFrequency(e.target.value)}
            >
              <option value="annual">Annual</option>
              <option value="monthly">Monthly</option>
              <option value="biweekly">Bi-weekly</option>
              <option value="weekly">Weekly</option>
            </Select>
            <Select
              label="Career goal"
              value={careerGoal}
              onChange={(e) => setCareerGoal(e.target.value)}
            >
              {CAREER_GOALS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </Select>
            <Input
              label="Job title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Software Engineer"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Years of experience"
                type="number"
                value={yearsExp}
                onChange={(e) => setYearsExp(e.target.value)}
              />
              <Input
                label="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Austin, TX"
              />
            </div>
            <Input
              label="Current savings ($)"
              type="number"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
            />
            <Input
              label="Profile picture URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
            />
            <Select label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.label} ({c.code})</option>)}
            </Select>
            <p className="text-xs text-muted">
              Estimated monthly income: {formatCurrency(monthlyIncome(Number(salary), payFrequency))}
            </p>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save profile'}
            </Button>
          </form>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold">Appearance</h3>
          <p className="mt-1 text-sm text-muted">Choose dark or light mode. Saved automatically.</p>
          <div className="mt-4">
            <ThemeToggle variant="pill" />
          </div>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold">Notifications</h3>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={budgetAlerts} onChange={(e) => setBudgetAlerts(e.target.checked)} /> Budget over-limit alerts</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={weeklySummary} onChange={(e) => setWeeklySummary(e.target.checked)} /> Weekly summary on dashboard</label>
          </div>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold">Data export</h3>
          <p className="mt-1 text-sm text-muted">Download your Upshift data.</p>
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
            }}>Export transactions CSV</Button>
          </div>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold text-danger">Delete account</h3>
          <p className="mt-1 text-sm text-muted">Permanently delete your profile and all financial data.</p>
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

        <Card>
          <h3 className="font-heading text-lg font-semibold">Subscription</h3>
          <p className="mt-1 text-sm text-muted">You're on the free plan unless you upgrade below.</p>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Plan</span>
              <span className="font-medium">
                {subscriptionStatus === 'active' ? 'Upshift Pro — $15/mo' : 'Free'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Status</span>
              <span className="font-medium capitalize text-mint">
                {statusLabel[subscriptionStatus] || subscriptionStatus}
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {subscriptionStatus !== 'active' && (
              <Button onClick={handleSubscribe} disabled={loading}>
                {loading ? 'Loading...' : 'Upgrade to Pro — $15/mo'}
              </Button>
            )}
            {(subscriptionStatus === 'active' || subscriptionStatus === 'trialing') && stripeCustomerId && (
              <Button variant="secondary" onClick={handleManageBilling} disabled={loading}>
                Manage billing
              </Button>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
