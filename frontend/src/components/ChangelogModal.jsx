import { X } from 'lucide-react'
import { CHANGELOG } from '../lib/constants'

export default function ChangelogModal({ open, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">What&apos;s new in Upshift</h2>
          <button type="button" onClick={onClose} className="text-muted hover:text-text" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          {CHANGELOG.map((entry) => (
            <div key={entry.version}>
              <p className="text-sm font-semibold text-accent">v{entry.version} · {entry.date}</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">
                {entry.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
