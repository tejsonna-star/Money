import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Logo, Button, Input } from '../components/UI'

export default function Login() {
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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) throw authError

      const profile = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', data.user.id)
        .single()

      if (profile.data?.onboarding_complete) {
        navigate('/dashboard')
      } else {
        navigate('/onboarding')
      }
    } catch (err) {
      setError(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Logo size="lg" />
          <h1 className="mt-6 font-heading text-2xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-muted">Sign in to your Upshift account</p>
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
              placeholder="••••••••"
              required
            />
          </div>
          <Button type="submit" className="mt-6 w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
          <p className="mt-6 text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/signup" className="text-accent hover:underline">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
