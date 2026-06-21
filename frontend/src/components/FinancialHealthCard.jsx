import { Trophy, Flame } from 'lucide-react'
import { PageSection, ProgressBar } from './UI'

const BADGE_LABELS = {
  first_goal: 'First goal completed',
  debt_free: 'Debt free',
  emergency_3mo: '3-month emergency fund',
  streak_7: '7-day logging streak',
}

export default function FinancialHealthCard({ score, streak, badges = [], challenge, onCompleteChallenge }) {
  return (
    <PageSection title="Financial health">
      <div className="flex flex-wrap items-center gap-6">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-accent/30">
          <span className="font-heading text-3xl font-bold text-accent">{score}</span>
        </div>
        <div className="flex-1 min-w-[200px]">
          <ProgressBar value={score} colorClass="bg-accent" />
          <p className="mt-2 flex items-center gap-1 text-sm text-muted">
            <Flame className="h-4 w-4 text-[#FFB020]" />
            {streak} day logging streak
          </p>
        </div>
      </div>
      {badges.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span key={b} className="inline-flex items-center gap-1 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs text-mint">
              <Trophy className="h-3 w-3" />
              {BADGE_LABELS[b] || b}
            </span>
          ))}
        </div>
      )}
      {challenge && (
        <div className="mt-4 rounded-lg border border-border bg-surface p-3">
          <p className="text-sm font-medium">Monthly challenge</p>
          <p className="mt-1 text-sm text-muted">{challenge.label}</p>
          <button type="button" onClick={onCompleteChallenge} className="mt-2 text-xs text-accent hover:underline">
            Mark complete (+{challenge.points} pts)
          </button>
        </div>
      )}
    </PageSection>
  )
}
