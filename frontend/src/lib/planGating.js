export const PLAN_RANK = { free: 0, plus: 1, pro: 2 }

export const FEATURES = {
  AI_INSIGHTS: 'ai_insights',
  SPENDING_CHARTS: 'spending_charts',
  RECURRING_TRANSACTIONS: 'recurring',
  CSV_EXPORT: 'csv_export',
  WEEKLY_SUMMARY: 'weekly_summary',
  AI_CHAT: 'ai_chat',
  CAREER_COACH: 'career_coach',
  WHAT_IF: 'what_if',
  ANOMALY_ALERTS: 'anomaly_alerts',
  NET_WORTH_PREDICTION: 'net_worth_prediction',
}

export const FEATURE_MIN_PLAN = {
  [FEATURES.AI_INSIGHTS]: 'plus',
  [FEATURES.SPENDING_CHARTS]: 'plus',
  [FEATURES.RECURRING_TRANSACTIONS]: 'plus',
  [FEATURES.CSV_EXPORT]: 'plus',
  [FEATURES.WEEKLY_SUMMARY]: 'plus',
  [FEATURES.AI_CHAT]: 'pro',
  [FEATURES.CAREER_COACH]: 'pro',
  [FEATURES.WHAT_IF]: 'pro',
  [FEATURES.ANOMALY_ALERTS]: 'pro',
  [FEATURES.NET_WORTH_PREDICTION]: 'pro',
}

export const NAV_PLAN_FEATURES = {
  '/dashboard/insights': FEATURES.AI_INSIGHTS,
  '/dashboard/chat': FEATURES.AI_CHAT,
  '/dashboard/career': FEATURES.CAREER_COACH,
}

export function resolveCurrentPlan(profile) {
  if (!profile) return 'free'
  if (profile.subscription_plan && profile.subscription_plan !== 'free') {
    return profile.subscription_plan
  }
  if (['active', 'trialing'].includes(profile.subscription_status)) return 'pro'
  return 'free'
}

export function hasFeature(plan, feature) {
  const required = FEATURE_MIN_PLAN[feature]
  if (!required) return true
  return (PLAN_RANK[plan] ?? 0) >= (PLAN_RANK[required] ?? 0)
}

export function getRequiredPlan(feature) {
  return FEATURE_MIN_PLAN[feature] || 'free'
}

export function getPlanLabel(plan) {
  if (plan === 'pro') return 'Pro'
  if (plan === 'plus') return 'Plus'
  return 'Free'
}
