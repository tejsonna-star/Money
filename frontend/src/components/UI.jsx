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

export function StatCard({ label, value, sub, trend, icon: Icon, loading = false, className = '' }) {
  const trendColor =
    trend === 'up' ? 'text-mint' : trend === 'down' ? 'text-danger' : 'text-muted'

  return (
    <Card className={className}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        {Icon && (
          <div className="rounded-lg bg-accent/10 p-2">
            <Icon className="h-4 w-4 text-accent" />
          </div>
        )}
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-9 w-32" />
      ) : (
        <p className="mt-2 font-heading text-3xl font-bold tracking-tight">{value}</p>
      )}
      {sub && !loading && <p className={`mt-1 text-sm ${trendColor}`}>{sub}</p>}
    </Card>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-border/70 ${className}`} />
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
    danger: 'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/20',
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
        className={`block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-base leading-normal text-text caret-accent placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm ${className}`}
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
        className={`block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-base leading-normal text-text focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm ${className}`}
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

export function ProgressBar({ value, max = 100, className = '', colorClass = 'bg-accent' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const barColor = pct >= 100 ? 'bg-danger' : pct >= 85 ? 'bg-[#FFB020]' : colorClass
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-border ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function PageSection({ title, children, action, className = '' }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 sm:p-6 ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {title && <h3 className="font-heading text-lg font-semibold">{title}</h3>}
        {action}
      </div>
      {children}
    </div>
  )
}
