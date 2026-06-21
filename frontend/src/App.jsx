import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/dashboard/Dashboard'
import Debt from './pages/dashboard/Debt'
import Budget from './pages/dashboard/Budget'
import Career from './pages/dashboard/Career'
import Settings from './pages/dashboard/Settings'
import { supabase, getProfile } from './lib/supabase'

function ProtectedRoute({ children }) {
  const [state, setState] = useState({ loading: true, authed: false, onboarded: false, subscribed: false })

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setState({ loading: false, authed: false, onboarded: false, subscribed: false })
        return
      }
      const profile = await getProfile(session.user.id)
      const subscribed = ['active', 'trialing'].includes(profile?.subscription_status)
      setState({
        loading: false,
        authed: true,
        onboarded: profile?.onboarding_complete,
        subscribed,
      })
    }
    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => check())
    return () => subscription.unsubscribe()
  }, [])

  if (state.loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    )
  }

  if (!state.authed) return <Navigate to="/login" replace />
  if (!state.onboarded) return <Navigate to="/onboarding" replace />

  return children
}

function PublicRoute({ children }) {
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session)
      setLoading(false)
    })
  }, [])

  if (loading) return null
  if (authed) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/debt" element={<ProtectedRoute><Debt /></ProtectedRoute>} />
        <Route path="/dashboard/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
        <Route path="/dashboard/career" element={<ProtectedRoute><Career /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
