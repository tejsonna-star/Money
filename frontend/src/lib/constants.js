export const BUDGET_TEMPLATES = {
  student: {
    label: 'Student',
    limits: { Rent: 800, Food: 250, Transportation: 80, Subscriptions: 30, Entertainment: 60, Utilities: 60, Other: 100 },
  },
  family: {
    label: 'Family',
    limits: { Rent: 2200, Food: 900, Transportation: 450, Subscriptions: 120, Utilities: 280, Insurance: 350, Entertainment: 200, Other: 300 },
  },
  freelancer: {
    label: 'Freelancer',
    limits: { Rent: 1500, Food: 400, Transportation: 150, Subscriptions: 80, Utilities: 120, Insurance: 200, Entertainment: 150, Other: 250 },
  },
}

export const GOAL_CATEGORIES = [
  { id: 'emergency', label: 'Emergency fund', icon: '🛡️' },
  { id: 'vacation', label: 'Vacation', icon: '✈️' },
  { id: 'car', label: 'Car', icon: '🚗' },
  { id: 'retirement', label: 'Retirement', icon: '🏖️' },
  { id: 'general', label: 'General', icon: '🎯' },
]

export const ACCOUNT_TYPES = [
  { id: 'checking', label: 'Checking' },
  { id: 'savings', label: 'Savings' },
  { id: 'credit', label: 'Credit card' },
  { id: 'investment', label: 'Investment' },
  { id: 'asset', label: 'Asset' },
  { id: 'other', label: 'Other' },
]

export const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
]

export const CHANGELOG = [
  { version: '2.0', date: '2026-06', items: ['Accounts & net worth tracking', 'Recurring transactions', 'Budget rollover & templates', 'Financial health score', 'Career raise simulator', 'Monthly AI insights'] },
  { version: '1.5', date: '2026-05', items: ['Transactions page', 'Goals tracker', 'AI Chat', 'Dark mode'] },
]

export const MONTHLY_CHALLENGES = [
  { id: 'no_spend_weekend', label: 'Try a no-spend weekend', points: 10 },
  { id: 'log_daily', label: 'Log transactions 7 days in a row', points: 15 },
  { id: 'review_budget', label: 'Review your budget mid-month', points: 10 },
]
