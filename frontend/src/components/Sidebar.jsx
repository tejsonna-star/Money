import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  Briefcase,
  Settings,
  LogOut,
} from 'lucide-react'
import { Logo } from './UI'
import { supabase } from '../lib/supabase'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/dashboard/debt', icon: CreditCard, label: 'Debt Tracker' },
  { to: '/dashboard/budget', icon: Wallet, label: 'Budget' },
  { to: '/dashboard/career', icon: Briefcase, label: 'Career Coach' },
  { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-6 py-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200 ${
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-muted hover:bg-card hover:text-text'
              }`
            }
          >
            <Icon className="h-4 w-4" />
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
    </aside>
  )
}

export function DashboardLayout({ children, title, subtitle }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="border-b border-border px-8 py-6">
          <h1 className="font-heading text-2xl font-bold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
