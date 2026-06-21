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
}) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="font-heading text-lg font-semibold">{title}</h3>
        </div>
        {onRefresh && (
          <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
            Refresh
          </Button>
        )}
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-2 text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Analyzing your data...</span>
          </div>
        ) : content ? (
          <div
            className={`text-sm leading-relaxed text-text/90 ${expanded ? '' : 'line-clamp-2'}`}
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
