import { createContext, useContext, useState, useEffect } from 'react'
import { getSession, getProfile } from '../lib/supabase'
import {
  resolveCurrentPlan,
  hasFeature as checkFeature,
  getPlanLabel,
  getRequiredPlan,
} from '../lib/planGating'

const PlanContext = createContext({
  plan: 'free',
  loading: true,
  profile: null,
  userEmail: '',
  hasFeature: () => false,
  planLabel: 'Free',
  getRequiredPlan,
})

export function PlanProvider({ children }) {
  const [plan, setPlan] = useState('free')
  const [profile, setProfile] = useState(null)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      const session = await getSession()
      if (!session) {
        if (active) setLoading(false)
        return
      }
      if (active) setUserEmail(session.user.email || '')
      const p = await getProfile(session.user.id)
      if (active) {
        setProfile(p)
        setPlan(resolveCurrentPlan(p))
        setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  return (
    <PlanContext.Provider
      value={{
        plan,
        profile,
        userEmail,
        loading,
        hasFeature: (feature) => checkFeature(plan, feature),
        planLabel: getPlanLabel(plan),
        getRequiredPlan,
      }}
    >
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  return useContext(PlanContext)
}
