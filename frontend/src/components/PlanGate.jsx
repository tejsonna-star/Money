import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { Button } from './UI'
import { usePlan } from '../context/PlanContext'
import { getPlanLabel, getRequiredPlan } from '../lib/planGating'

export function PlanLockIcon({ feature, className = 'h-3.5 w-3.5 shrink-0 text-muted' }) {
  const { hasFeature } = usePlan()
  if (hasFeature(feature)) return null
  return <Lock className={className} aria-label="Upgrade required" />
}

export default function PlanGate({ feature, children, className = '', title }) {
  const { hasFeature } = usePlan()

  if (hasFeature(feature)) return children

  const required = getRequiredPlan(feature)
  const label = getPlanLabel(required)

  return (
    <div className={`relative overflow-hidden rounded-xl ${className}`}>
      <div className="pointer-events-none select-none opacity-40 blur-[2px]">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/90 p-6 text-center backdrop-blur-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card">
          <Lock className="h-5 w-5 text-muted" />
        </div>
        <div>
          <p className="font-medium">{title || `${label} plan required`}</p>
          <p className="mt-1 text-sm text-muted">
            Upgrade to {label} to unlock this feature.
          </p>
        </div>
        <Link to="/dashboard/subscription">
          <Button size="sm">View plans</Button>
        </Link>
      </div>
    </div>
  )
}
