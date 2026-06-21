import { Check, Sparkles } from 'lucide-react'
import { Button } from './UI'
import { SUBSCRIPTION_PLANS } from '../lib/constants'

export default function SubscriptionPlans({
  currentPlan = 'free',
  loading = false,
  stripeConfigured = false,
  onSelectPlan,
  onManageBilling,
  hasStripeCustomer = false,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-xl font-bold">Choose your plan</h3>
        <p className="mt-1 text-sm text-muted">
          Start free. Upgrade anytime — cancel whenever you want.
        </p>
      </div>

      {!stripeConfigured && (
        <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div className="text-sm">
            <p className="font-medium text-text">Billing preview mode</p>
            <p className="mt-0.5 text-muted">
              Stripe isn&apos;t connected yet. Plans are live here for preview — when you add{' '}
              <code className="text-xs">STRIPE_SECRET_KEY</code> and price IDs on Vercel, checkout will work automatically.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const isFree = plan.id === 'free'

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-xl border p-6 transition-shadow ${
                plan.highlighted
                  ? 'border-accent bg-accent/5 shadow-[0_0_32px_rgba(108,99,255,0.15)]'
                  : 'border-border bg-card'
              }`}
            >
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-0.5 text-xs font-medium text-white">
                  {plan.badge}
                </span>
              )}

              <div>
                <h4 className="font-heading text-lg font-semibold">{plan.name}</h4>
                <p className="mt-1 text-sm text-muted">{plan.description}</p>
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                {isFree ? (
                  <span className="font-heading text-4xl font-bold">$0</span>
                ) : (
                  <>
                    <span className="font-heading text-4xl font-bold">${plan.price}</span>
                    <span className="text-sm text-muted">/{plan.period}</span>
                  </>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : isFree ? (
                  <Button variant="ghost" className="w-full" disabled>
                    Included
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'primary' : 'secondary'}
                    disabled={loading}
                    onClick={() => onSelectPlan(plan.id)}
                  >
                    {loading ? 'Loading...' : stripeConfigured ? plan.cta : `Preview ${plan.name}`}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {hasStripeCustomer && currentPlan !== 'free' && stripeConfigured && (
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-sm text-muted">Need to update payment method or cancel?</p>
          <Button variant="ghost" size="sm" className="mt-2" onClick={onManageBilling} disabled={loading}>
            Manage billing
          </Button>
        </div>
      )}

      <p className="text-center text-xs text-muted">
        {stripeConfigured
          ? 'Plus & Pro include a 7-day free trial. Prices in USD.'
          : 'Add STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_PLUS, and STRIPE_PRICE_ID_PRO to enable checkout.'}
      </p>
    </div>
  )
}
