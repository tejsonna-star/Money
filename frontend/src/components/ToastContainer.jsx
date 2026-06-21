import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'
import { subscribeToasts } from '../lib/toast'

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return subscribeToasts((payload) => {
      setToasts((prev) => [...prev, payload])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== payload.id))
      }, 3500)
    })
  }, [])

  function dismiss(id) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex animate-fade-in items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
            t.type === 'error'
              ? 'border-danger/30 bg-card text-text'
              : 'border-mint/30 bg-card text-text'
          }`}
        >
          {t.type === 'error' ? (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
          )}
          <p className="flex-1 text-sm leading-relaxed">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            className="text-muted hover:text-text"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
