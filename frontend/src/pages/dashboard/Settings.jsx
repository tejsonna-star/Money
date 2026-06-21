import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '../../components/Sidebar'
import { Button, Card } from '../../components/UI'
import { getSession, getProfile, formatCurrency, monthlyIncome } from '../../lib/supabase'
import { createCheckoutSession, createPortalSession } from '../../lib/api'

export default function Settings() {
  const [searchParams] = useSearchParams()
  const [profile, setProfile] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setToken(session.access_token)
      setProfile(await getProfile(session.user.id))
    }
    load()
  }, [])

  useEffect(() => {
    if (searchParams.get('success')) setMessage('Subscription activated successfully!')
    if (searchParams.get('canceled')) setMessage('Checkout was canceled.')
  }, [searchParams])

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

  const status = profile?.subscription_status || 'trialing'
  const statusLabel = {
    trialing: 'Free Trial',
    active: 'Active',
    canceled: 'Canceled',
    past_due: 'Past Due',
  }

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account and subscription">
      {message && (
        <div className="mb-6 rounded-lg border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-mint">
          {message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-heading text-lg font-semibold">Subscription</h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Plan</span>
              <span className="font-medium">Upshift Pro — $15/mo</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Status</span>
              <span className={`font-medium capitalize ${
                status === 'active' || status === 'trialing' ? 'text-mint' : 'text-danger'
              }`}>
                {statusLabel[status] || status}
              </span>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            {(status === 'trialing' || status === 'canceled') && (
              <Button onClick={handleSubscribe} disabled={loading}>
                {loading ? 'Loading...' : 'Subscribe Now'}
              </Button>
            )}
            {(status === 'active' || status === 'trialing') && profile?.stripe_customer_id && (
              <Button variant="secondary" onClick={handleManageBilling} disabled={loading}>
                Manage Billing
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="font-heading text-lg font-semibold">Profile</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Salary</span>
              <span>{formatCurrency(profile?.salary)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Pay frequency</span>
              <span className="capitalize">{profile?.pay_frequency || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Career goal</span>
              <span>{profile?.career_goal || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Monthly income</span>
              <span>{formatCurrency(monthlyIncome(profile?.salary, profile?.pay_frequency))}</span>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
