import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo, Button, Input } from '../components/UI'

export default function Signup() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          subscription_status: 'trialing',
          onboarding_complete: false,
        })
      }

      navigate('/onboarding')
    } catch (err) {
      setError(err.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" />
          <h1 className="mt-6 font-heading text-2xl font-bold">Create your account</h1>
          <p className="mt-2 text-sm text-muted">Start your 7-day free trial</p>
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
            {loading ? 'Creating account...' : 'Start Free Trial'}
          </Button>
          <p className="mt-4 text-center text-xs text-muted">
            By signing up, you agree to our terms. $15/mo after trial.
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
