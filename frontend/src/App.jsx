import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Onboarding from './pages/Onboarding'
import ToastContainer from './components/ToastContainer'
import { supabase, getProfile } from './lib/supabase'

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const Accounts = lazy(() => import('./pages/dashboard/Accounts'))
const Insights = lazy(() => import('./pages/dashboard/Insights'))
const Debt = lazy(() => import('./pages/dashboard/Debt'))
const Budget = lazy(() => import('./pages/dashboard/Budget'))
const Career = lazy(() => import('./pages/dashboard/Career'))
const Settings = lazy(() => import('./pages/dashboard/Settings'))
const Chat = lazy(() => import('./pages/dashboard/Chat'))
const Transactions = lazy(() => import('./pages/dashboard/Transactions'))
const Goals = lazy(() => import('./pages/dashboard/Goals'))

const emptyAuthState = { loading: true, authed: false, onboarded: false }

function PageLoader() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
    </div>
  )
}

function LazyPage({ children }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

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
        <Route path="/dashboard" element={<ProtectedRoute><LazyPage><Dashboard /></LazyPage></ProtectedRoute>} />
        <Route path="/dashboard/accounts" element={<ProtectedRoute><LazyPage><Accounts /></LazyPage></ProtectedRoute>} />
        <Route path="/dashboard/insights" element={<ProtectedRoute><LazyPage><Insights /></LazyPage></ProtectedRoute>} />
        <Route path="/dashboard/transactions" element={<ProtectedRoute><LazyPage><Transactions /></LazyPage></ProtectedRoute>} />
        <Route path="/dashboard/debt" element={<ProtectedRoute><LazyPage><Debt /></LazyPage></ProtectedRoute>} />
        <Route path="/dashboard/budget" element={<ProtectedRoute><LazyPage><Budget /></LazyPage></ProtectedRoute>} />
        <Route path="/dashboard/goals" element={<ProtectedRoute><LazyPage><Goals /></LazyPage></ProtectedRoute>} />
        <Route path="/dashboard/career" element={<ProtectedRoute><LazyPage><Career /></LazyPage></ProtectedRoute>} />
        <Route path="/dashboard/chat" element={<ProtectedRoute><LazyPage><Chat /></LazyPage></ProtectedRoute>} />
        <Route path="/dashboard/settings" element={<ProtectedRoute><LazyPage><Settings /></LazyPage></ProtectedRoute>} />
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
