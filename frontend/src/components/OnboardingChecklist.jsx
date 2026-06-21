import { Link } from 'react-router-dom'
import { CheckCircle2, Circle } from 'lucide-react'
import { PageSection } from './UI'

const ITEMS = [
  { key: 'account', label: 'Add your first account', to: '/dashboard/accounts' },
  { key: 'budget', label: 'Set a budget', to: '/dashboard/budget' },
  { key: 'goal', label: 'Create a goal', to: '/dashboard/goals' },
  { key: 'transaction', label: 'Log a transaction', to: '/dashboard/transactions' },
]

export default function OnboardingChecklist({ checklist = {} }) {
  const done = ITEMS.filter((i) => checklist[i.key]).length
  if (done === ITEMS.length) return null

  return (
    <PageSection title="Getting started" className="mb-6">
      <p className="mb-3 text-sm text-muted">{done}/{ITEMS.length} complete — finish setup to unlock your full dashboard</p>
      <ul className="space-y-2">
        {ITEMS.map(({ key, label, to }) => (
          <li key={key}>
            <Link to={to} className="flex items-center gap-2 text-sm hover:text-accent">
              {checklist[key] ? (
                <CheckCircle2 className="h-4 w-4 text-mint" />
              ) : (
                <Circle className="h-4 w-4 text-muted" />
              )}
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </PageSection>
  )
}
