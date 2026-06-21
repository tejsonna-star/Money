import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
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
import Chat from './pages/dashboard/Chat'
import Transactions from './pages/dashboard/Transactions'
import Goals from './pages/dashboard/Goals'
import ToastContainer from './components/ToastContainer'
import { supabase, getProfile } from './lib/supabase'

const emptyAuthState = { loading: true, authed: false, onboarded: false }

async function resolveAuthState(session) {
  if (!session) {
    return { loading: false, authed: false, onboarded: false }
  }
  const profile = await getProfile(session.user.id)
  return {
    loading: false,
    authed: true,
    onboarded: Boolean(profile?.onboarding_complete),
  }
}

function ProtectedRoute({ children }) {
  const [state, setState] = useState(emptyAuthState)

  useEffect(() => {
    let active = true

    async function finish(session) {
      const next = await resolveAuthState(session)
      if (active) setState(next)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          if (event === 'SIGNED_OUT') {
            if (active) setState({ loading: false, authed: false, onboarded: false })
            return
          }
          await finish(session)
          if (window.location.hash.includes('access_token')) {
            window.history.replaceState(null, '', window.location.pathname)
          }
        }
      }
    )

    const timeout = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      await finish(session)
    }, 4000)

    return () => {
      active = false
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [])

  if (state.loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-sm text-muted">Loading your dashboard...</p>
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
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        if (active) {
          setAuthed(!!session)
          setLoading(false)
        }
      }
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  if (loading) return null
  if (authed) return <Navigate to="/dashboard" replace />
  return children
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <div key={location.pathname} className="animate-fade-in">
      <Routes location={location}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/dashboard/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/dashboard/debt" element={<ProtectedRoute><Debt /></ProtectedRoute>} />
        <Route path="/dashboard/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
        <Route path="/dashboard/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
        <Route path="/dashboard/career" element={<ProtectedRoute><Career /></ProtectedRoute>} />
        <Route path="/dashboard/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
      <ToastContainer />
    </BrowserRouter>
  )
}
