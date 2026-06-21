import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DashboardLayout } from '../../components/Sidebar'
import SubscriptionPlans from '../../components/SubscriptionPlans'
import {
  getSession, getProfile, updateProfile,
} from '../../lib/supabase'
import { createCheckoutSession, createPortalSession, getSubscriptionStatus } from '../../lib/api'
import { toastSuccess, toastError } from '../../lib/toast'

import { resolveCurrentPlan } from '../../lib/planGating'

export default function Subscription() {
  const [searchParams] = useSearchParams()
  const [userId, setUserId] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [subscriptionPlan, setSubscriptionPlan] = useState('free')
  const [stripeConfigured, setStripeConfigured] = useState(false)
  const [stripeCustomerId, setStripeCustomerId] = useState(null)

  useEffect(() => {
    async function load() {
      const session = await getSession()
      if (!session) return
      setUserId(session.user.id)
      setToken(session.access_token)
      const profile = await getProfile(session.user.id)
      if (profile) {
        setSubscriptionPlan(resolveCurrentPlan(profile))
        setStripeCustomerId(profile.stripe_customer_id)
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
      const plan = searchParams.get('plan')
      if (plan === 'plus' || plan === 'pro') setSubscriptionPlan(plan)
    }
    if (searchParams.get('canceled')) {
      setMessage('Checkout was canceled.')
    }
  }, [searchParams])

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

  return (
    <DashboardLayout title="Subscription" subtitle="Compare plans and manage your billing">
      {message && (
        <div className="mb-6 rounded-lg border border-mint/30 bg-mint/10 px-4 py-3 text-sm text-mint">
          {message}
        </div>
      )}

      <SubscriptionPlans
        currentPlan={subscriptionPlan}
        loading={loading}
        stripeConfigured={stripeConfigured}
        onSelectPlan={handleSelectPlan}
        onManageBilling={handleManageBilling}
        hasStripeCustomer={Boolean(stripeCustomerId)}
      />
    </DashboardLayout>
  )
}
