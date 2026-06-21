import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  Briefcase,
  Settings,
  LogOut,
  MessageCircle,
  Receipt,
  Target,
  Landmark,
  LineChart,
  Menu,
  X,
} from 'lucide-react'
import { Logo } from './UI'
import ThemeToggle from './ThemeToggle'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/accounts', icon: Landmark, label: 'Accounts' },
  { to: '/dashboard/transactions', icon: Receipt, label: 'Transactions' },
  { to: '/dashboard/insights', icon: LineChart, label: 'Insights' },
  { to: '/dashboard/debt', icon: CreditCard, label: 'Debt Tracker' },
  { to: '/dashboard/budget', icon: Wallet, label: 'Budget' },
  { to: '/dashboard/goals', icon: Target, label: 'Goals' },
  { to: '/dashboard/career', icon: Briefcase, label: 'Career Coach' },
  { to: '/dashboard/chat', icon: MessageCircle, label: 'AI Chat' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

function SidebarNav({ onNavigate }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:bg-card hover:text-text'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted transition-colors hover:bg-card hover:text-text"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </>
  )
}

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-surface transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <Logo />
          <button type="button" className="lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>
        <SidebarNav onNavigate={onClose} />
      </aside>
    </>
  )
}

export function DashboardLayout({ children, title, subtitle, lastUpdated, headerAction }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="border-b border-border px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-border p-2 text-muted lg:hidden"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="truncate font-heading text-xl font-bold sm:text-2xl">{title}</h1>
                  {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
                  {lastUpdated && (
                    <p className="mt-1 text-xs text-muted">Last updated {lastUpdated}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {headerAction}
              <ThemeToggle variant="pill" />
            </div>
          </div>
        </div>
        <div className="animate-fade-in p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
