import { Link } from 'react-router-dom'
import {
  ArrowRight,
  TrendingUp,
  Target,
  Brain,
  Shield,
  BarChart3,
  Check,
} from 'lucide-react'
import { Logo, Button } from '../components/UI'
import ThemeToggle from '../components/ThemeToggle'

const painPoints = [
  {
    title: 'Drowning in debt with no clear plan',
    description:
      'Minimum payments keep you stuck for years. You need a strategy — not guesswork.',
  },
  {
    title: "Don't know if you're underpaid",
    description:
      'Without market data, you leave money on the table every year you skip negotiating.',
  },
  {
    title: 'No idea when you can afford to make a career move',
    description:
      'Quitting without a runway plan is risky. You need numbers before you need courage.',
  },
]

const features = [
  {
    icon: BarChart3,
    title: 'Debt Payoff Engine',
    description:
      'Compare avalanche vs snowball strategies side by side. See exactly when you will be debt-free and how much interest you will save.',
  },
  {
    icon: Target,
    title: 'Budget Tracker',
    description:
      'Visualize spending by category, track cash flow, and calculate your emergency runway in months.',
  },
  {
    icon: Brain,
    title: 'Raise Negotiator',
    description:
      'Get market salary estimates, underpaid analysis, and a ready-to-use negotiation script based on your wins.',
  },
  {
    icon: TrendingUp,
    title: 'Career Move Calculator',
    description:
      'Know exactly how much to save before quitting. Get a realistic savings plan and AI assessment.',
  },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Nav */}
      <header className="landing-header fixed top-0 z-50 w-full border-b border-border/50 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted transition-colors hover:text-text">
              Features
            </a>
            <a href="#pricing" className="text-sm text-muted transition-colors hover:text-text">
              Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle variant="pill" />
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link to="/signup">
              <Button size="sm">Sign up free</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 pt-32 pb-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full hero-glow blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted">
            <Shield className="h-3.5 w-3.5 text-mint" />
            AI-powered finance & career intelligence
          </div>
          <h1 className="font-heading text-5xl font-bold leading-tight tracking-tight md:text-6xl lg:text-7xl">
            Know your money.{' '}
            <span className="text-accent">Own your career.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
            Upshift connects your finances and career in one dashboard — so you always
            know where you stand and where you're going.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                Sign up free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="secondary" size="lg">See how it works</Button>
            </a>
          </div>
          <p className="mt-4 text-sm text-muted">Free to start · Upgrade to Pro anytime — $15/mo</p>
        </div>

        {/* Dashboard preview mock */}
        <div className="relative mx-auto mt-16 max-w-5xl animate-fade-in">
          <div className="rounded-xl border border-border bg-surface p-1">
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <div className="mock-window-dot-red h-3 w-3 rounded-full" />
                <div className="mock-window-dot-mint h-3 w-3 rounded-full" />
                <div className="mock-window-dot-accent h-3 w-3 rounded-full" />
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-bg p-4">
                  <p className="text-xs text-muted">Net Worth</p>
                  <p className="mt-1 font-heading text-2xl font-bold text-mint">$24,850</p>
                </div>
                <div className="rounded-lg border border-border bg-bg p-4">
                  <p className="text-xs text-muted">Monthly Cash Flow</p>
                  <p className="mt-1 font-heading text-2xl font-bold">+$1,240</p>
                </div>
                <div className="rounded-lg border border-border bg-bg p-4">
                  <p className="text-xs text-muted">Debt Payoff</p>
                  <div className="mt-2 h-2 rounded-full bg-border">
                    <div className="h-full w-[38%] rounded-full bg-accent" />
                  </div>
                  <p className="mt-1 text-xs text-muted">38% complete · 14 months left</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 p-4">
                <p className="text-xs font-medium text-accent">Your next move</p>
                <p className="mt-1 text-sm text-text/80">
                  Switch to avalanche payoff — you will save $2,340 in interest and be debt-free 3 months sooner.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold md:text-4xl">
              The problems keeping you stuck
            </h2>
            <p className="mt-4 text-muted">
              Most working adults are flying blind on two fronts — money and career.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {painPoints.map((point, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-6 transition-colors duration-200 hover:border-accent/30"
              >
                <span className="font-heading text-4xl font-bold text-border">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold md:text-4xl">
              Everything you need to level up
            </h2>
            <p className="mt-4 text-muted">
              Four tools. One dashboard. Powered by AI that knows your numbers.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-xl border border-border bg-card p-8 transition-colors duration-200 hover:border-accent/30"
              >
                <div className="mb-4 inline-flex rounded-lg border border-border bg-surface p-3 transition-colors group-hover:border-accent/30">
                  <Icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-heading text-xl font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold md:text-4xl">
              Simple, honest pricing
            </h2>
            <p className="mt-4 text-muted">One plan. Full access. No upsells.</p>
          </div>
          <div className="mx-auto mt-12 max-w-md">
            <div className="rounded-xl border border-accent/30 bg-card p-8">
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-5xl font-bold">$15</span>
                <span className="text-muted">/month</span>
              </div>
              <p className="mt-2 text-sm text-mint">Free to start — upgrade anytime</p>
              <ul className="mt-8 space-y-3">
                {[
                  'Debt payoff engine with AI recommendations',
                  'Budget tracker & runway calculator',
                  'Raise negotiator with market data',
                  'Career move calculator',
                  'Unlimited AI insights',
                  'Cancel anytime',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                    <span className="text-text/90">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className="mt-8 block">
                <Button className="w-full" size="lg">Sign up free</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">
            Stop guessing. Start upshifting.
          </h2>
          <p className="mt-4 text-muted">
            Join working adults who finally have a plan for their money and career.
          </p>
          <Link to="/signup" className="mt-8 inline-block">
            <Button size="lg" className="gap-2">
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-12">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 md:flex-row">
          <Logo />
          <div className="flex gap-8 text-sm text-muted">
            <a href="#features" className="transition-colors hover:text-text">Features</a>
            <a href="#pricing" className="transition-colors hover:text-text">Pricing</a>
            <Link to="/login" className="transition-colors hover:text-text">Log in</Link>
          </div>
          <p className="text-sm text-muted">© {new Date().getFullYear()} Upshift. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
