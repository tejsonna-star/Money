import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { getTheme, setTheme, subscribeTheme } from '../lib/theme'

export default function ThemeToggle({ className = '', variant = 'icon' }) {
  const [theme, setThemeState] = useState('dark')

  useEffect(() => {
    setThemeState(getTheme())
    return subscribeTheme(setThemeState)
  }, [])

  function pick(next) {
    setThemeState(setTheme(next))
  }

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex rounded-lg border border-border bg-surface p-1 ${className}`}
        role="group"
        aria-label="Theme"
      >
        <button
          type="button"
          onClick={() => pick('dark')}
          aria-pressed={theme === 'dark'}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            theme === 'dark'
              ? 'bg-accent text-white shadow-sm'
              : 'text-muted hover:text-text'
          }`}
        >
          <Moon className="h-3.5 w-3.5" />
          Dark
        </button>
        <button
          type="button"
          onClick={() => pick('light')}
          aria-pressed={theme === 'light'}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            theme === 'light'
              ? 'bg-accent text-white shadow-sm'
              : 'text-muted hover:text-text'
          }`}
        >
          <Sun className="h-3.5 w-3.5" />
          Light
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => pick(theme === 'dark' ? 'light' : 'dark')}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors duration-200 hover:border-accent/40 hover:text-text ${className}`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

export function ThemeToggleBar({ className = '' }) {
  return (
    <div className={`fixed right-4 top-4 z-50 ${className}`}>
      <ThemeToggle variant="pill" />
    </div>
  )
}
