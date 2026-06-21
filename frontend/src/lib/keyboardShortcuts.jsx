import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function useKeyboardShortcuts() {
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(e) {
      if (e.target.matches('input, textarea, select')) return
      if (e.metaKey || e.ctrlKey) return

      const routes = {
        d: '/dashboard',
        t: '/dashboard/transactions',
        b: '/dashboard/budget',
        g: '/dashboard/goals',
        a: '/dashboard/accounts',
        i: '/dashboard/insights',
        c: '/dashboard/career',
        '/': '/dashboard/chat',
      }

      if (routes[e.key]) {
        e.preventDefault()
        navigate(routes[e.key])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])
}

export function KeyboardHints() {
  return (
    <p className="text-xs text-muted">
      Shortcuts: <kbd className="rounded border border-border px-1">d</kbd> dashboard ·{' '}
      <kbd className="rounded border border-border px-1">t</kbd> transactions ·{' '}
      <kbd className="rounded border border-border px-1">b</kbd> budget ·{' '}
      <kbd className="rounded border border-border px-1">a</kbd> accounts
    </p>
  )
}
