const STORAGE_KEY = 'upshift-theme'

export function getTheme() {
  if (typeof window === 'undefined') return 'dark'
  return localStorage.getItem(STORAGE_KEY) || 'dark'
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)
}

export function initTheme() {
  const saved = getTheme()
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
  const theme = localStorage.getItem(STORAGE_KEY) || (prefersLight ? 'light' : 'dark')
  setTheme(theme)
  return theme
}

export function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}
