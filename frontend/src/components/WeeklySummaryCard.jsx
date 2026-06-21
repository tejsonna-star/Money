import { Mail } from 'lucide-react'
import { PageSection } from './UI'

export default function WeeklySummaryCard({ summary, loading }) {
  return (
    <PageSection title="Weekly summary" className="border-accent/20 bg-gradient-to-br from-accent/5 to-transparent">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-accent/10 p-2">
          <Mail className="h-5 w-5 text-accent" />
        </div>
        <div className="min-w-0 flex-1">
          {loading ? (
            <p className="text-sm text-muted">Generating your weekly recap...</p>
          ) : summary ? (
            <div className="text-sm leading-relaxed text-text/90 whitespace-pre-wrap break-words">
              {summary}
            </div>
          ) : (
            <p className="text-sm text-muted">Your weekly financial recap will appear here.</p>
          )}
        </div>
      </div>
    </PageSection>
  )
}
