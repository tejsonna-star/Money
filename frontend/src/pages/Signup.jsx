import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { supabase, getSupabaseConfigError } from '../lib/supabase'
import { Logo, Button, Input } from '../components/UI'
import { ThemeToggleBar } from '../components/ThemeToggle'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const configError = getSupabaseConfigError()
      if (configError) throw new Error(configError)

      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      })
      if (authError) throw authError

      // Email confirmation required — no session yet
      if (data.user && !data.session) {
        setEmailSent(true)
        return
      }

      // Email confirm disabled — go straight to onboarding
      if (data.user && data.session) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          subscription_status: 'free',
          subscription_plan: 'free',
          onboarding_complete: false,
        })
        window.location.href = '/onboarding'
      }
    } catch (err) {
      const msg = err.message || 'Failed to create account'
      setError(msg === 'Failed to fetch' ? 'Cannot reach Supabase. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set on Vercel, then redeploy.' : msg)
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-bg px-6">
        <ThemeToggleBar />
        <div className="w-full max-w-md text-center">
          <Logo size="lg" />
          <div className="mt-8 rounded-xl border border-accent/30 bg-accent/5 p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-accent/30 bg-surface">
              <Mail className="h-7 w-7 text-accent" />
            </div>
            <h1 className="font-heading text-2xl font-bold">Check your email</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              We sent a verification link to{' '}
              <span className="font-medium text-text">{email}</span>.
              Click the link to activate your account, then log in.
            </p>
            <p className="mt-4 text-xs text-muted">
              Didn't get it? Check spam, or wait a minute and try signing up again.
            </p>
            <Link to="/login" className="mt-6 inline-block">
              <Button className="w-full">Go to log in</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-6">
      <ThemeToggleBar />
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" />
          <h1 className="mt-6 font-heading text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-muted">Free to sign up — no credit card required</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-8">
          {error && (
            <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create free account'}
          </Button>
          <p className="mt-4 text-center text-xs text-muted">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-accent hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
          </p>
          <p className="mt-2 text-center text-xs text-muted">
            Upgrade to Plus or Pro anytime in Subscription.
          </p>
          <p className="mt-4 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:underline">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
