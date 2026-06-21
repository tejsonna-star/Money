import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from './UI'
import TypewriterText from './TypewriterText'

export default function AIInsight({
  title = 'AI Insight',
  content,
  loading = false,
  onRefresh,
  actionLabel,
  onAction,
  prominent = false,
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-xl border p-4 sm:p-6 ${
        prominent
          ? 'border-accent/40 bg-gradient-to-br from-accent/15 via-accent/5 to-transparent shadow-[0_0_40px_rgba(108,99,255,0.12)]'
          : 'border-accent/20 bg-accent/5'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className={`rounded-lg p-2 ${prominent ? 'bg-accent/20' : 'bg-accent/10'}`}>
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <h3 className="font-heading text-lg font-semibold">{title}</h3>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
        )}
      </div>

      <div className="mt-4 min-w-0">
        {loading ? (
          <div className="flex items-center gap-2 text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Analyzing your data...</span>
          </div>
        ) : content ? (
          <div
            className={`min-w-0 break-words text-sm leading-relaxed text-text/90 ${expanded ? '' : 'line-clamp-2'}`}
            onClick={() => setExpanded(!expanded)}
          >
            <TypewriterText text={content} animate key={content} />
          </div>
        ) : (
          <p className="text-sm text-muted">
            Get personalized advice based on your financial data.
          </p>
        )}
      </div>

      {onAction && (
        <div className="mt-4">
          <Button variant="mint" size="sm" onClick={onAction} disabled={loading}>
            {actionLabel || 'Ask AI'}
          </Button>
        </div>
      )}
    </div>
  )
}
