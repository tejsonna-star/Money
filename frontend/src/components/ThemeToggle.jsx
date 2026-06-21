import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { getTheme, toggleTheme } from '../lib/theme'

export default function ThemeToggle({ className = '' }) {
  const [theme, setThemeState] = useState('dark')

  useEffect(() => {
    setThemeState(getTheme())
  }, [])

  function handleToggle() {
    setThemeState(toggleTheme())
  }

  return (
    <button
      onClick={handleToggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface text-muted transition-colors duration-200 hover:border-accent/40 hover:text-text ${className}`}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
