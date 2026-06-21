import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Card, Input, Select } from '../../components/UI'
import { supabase, getSession, getProfile, formatCurrency, monthlyIncome } from '../../lib/supabase'
import { createCheckoutSession, createPortalSession } from '../../lib/api'

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
      }
      const { error: updateError } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)
      if (updateError) throw updateError
      setMessage('Profile saved.')
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
            <p className="text-xs text-muted">
              Estimated monthly income: {formatCurrency(monthlyIncome(Number(salary), payFrequency))}
            </p>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save profile'}
            </Button>
          </form>
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
