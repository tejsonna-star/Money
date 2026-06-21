import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button } from './UI'
import { usePlan } from '../context/PlanContext'
import { getPlanLabel, getRequiredPlan } from '../lib/planGating'

export function PlanLockIcon({ feature, className = 'h-3.5 w-3.5 shrink-0 text-muted' }) {
  const { hasFeature, loading } = usePlan()
  if (loading || hasFeature(feature)) return null
  return <Lock className={className} aria-label="Upgrade required" />
}

export function PlanLockedButton({ feature, label, size = 'sm', className = '' }) {
  const { hasFeature, loading } = usePlan()
  if (loading || hasFeature(feature)) return null
  const required = getPlanLabel(getRequiredPlan(feature))
  return (
    <Link to="/dashboard/subscription" title={`Requires ${required} plan`} className={className}>
      <Button variant="secondary" size={size} className="gap-1.5">
        <Lock className="h-4 w-4 shrink-0" />
        {label}
      </Button>
    </Link>
  )
}

export default function PlanGate({ feature, children, className = '', title, compact = false }) {
  const { hasFeature, loading } = usePlan()

  if (loading) {
    return <div className={className}>{children}</div>
  }

  if (hasFeature(feature)) {
    return children
  }

  const required = getRequiredPlan(feature)
  const label = getPlanLabel(required)
  const minH = compact ? 'min-h-[180px]' : 'min-h-[260px]'

  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/80 bg-surface/60 px-6 py-10 text-center ${minH} ${className}`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-card shadow-sm">
        <Lock className="h-5 w-5 shrink-0 text-muted" />
      </div>
      <div className="max-w-sm px-2">
        <p className="font-medium">{title || `${label} plan required`}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Upgrade to {label} to unlock this feature.
        </p>
      </div>
      <Link to="/dashboard/subscription">
        <Button size="sm">View plans</Button>
      </Link>
    </div>
  )
}
