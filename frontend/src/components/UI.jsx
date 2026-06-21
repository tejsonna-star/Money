import { Link } from 'react-router-dom'

export function Card({ children, className = '', hover = false }) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-6 ${
        hover ? 'transition-colors duration-200 hover:border-accent/40' : ''
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function StatCard({ label, value, sub, trend, className = '' }) {
  const trendColor =
    trend === 'up' ? 'text-mint' : trend === 'down' ? 'text-danger' : 'text-muted'

  return (
    <Card className={className}>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 font-heading text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className={`mt-1 text-sm ${trendColor}`}>{sub}</p>}
    </Card>
  )
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  as: Component = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-accent text-white hover:bg-accent-hover',
    secondary: 'border border-border bg-surface text-text hover:border-accent/50',
    ghost: 'text-muted hover:text-text hover:bg-surface',
    mint: 'bg-mint/10 text-mint border border-mint/30 hover:bg-mint/20',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  return (
    <Component
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}

export function Input({ label, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm text-muted">{label}</span>}
      <input
        className={`w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${className}`}
        {...props}
      />
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}

export function Select({ label, children, error, className = '', ...props }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm text-muted">{label}</span>}
      <select
        className={`w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="mt-1 block text-sm text-danger">{error}</span>}
    </label>
  )
}

export function Logo({ size = 'md' }) {
  const sizes = { sm: 'text-lg', md: 'text-xl', lg: 'text-2xl' }
  return (
    <Link to="/" className={`font-heading font-bold tracking-tight ${sizes[size]}`}>
      <span className="text-accent">Up</span>
      <span className="text-text">shift</span>
    </Link>
  )
}

export function ProgressBar({ value, max = 100, className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-border ${className}`}>
      <div
        className="h-full rounded-full bg-accent transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
