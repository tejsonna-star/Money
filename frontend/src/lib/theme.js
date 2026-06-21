const STORAGE_KEY = 'upshift-theme'
const listeners = new Set()

export function getTheme() {
  if (typeof window === 'undefined') return 'dark'
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
}

export function setTheme(theme) {
  const next = theme === 'light' ? 'light' : 'dark'
  document.documentElement.setAttribute('data-theme', next)
  localStorage.setItem(STORAGE_KEY, next)
  listeners.forEach((fn) => fn(next))
  return next
}

export function subscribeTheme(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
  const theme = saved === 'light' || saved === 'dark' ? saved : (prefersLight ? 'light' : 'dark')
  setTheme(theme)
  return theme
}

export function toggleTheme() {
  return setTheme(getTheme() === 'dark' ? 'light' : 'dark')
}
