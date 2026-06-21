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
  { code: 'USD', symbol: '$', label: 'US Dollar', locale: 'en-US' },
  { code: 'CAD', symbol: 'C$', label: 'Canadian Dollar', locale: 'en-CA' },
  { code: 'GBP', symbol: '£', label: 'British Pound', locale: 'en-GB' },
  { code: 'EUR', symbol: '€', label: 'Euro', locale: 'de-DE' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar', locale: 'en-AU' },
  { code: 'NZD', symbol: 'NZ$', label: 'New Zealand Dollar', locale: 'en-NZ' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen', locale: 'ja-JP' },
  { code: 'CNY', symbol: '¥', label: 'Chinese Yuan', locale: 'zh-CN' },
  { code: 'INR', symbol: '₹', label: 'Indian Rupee', locale: 'en-IN' },
  { code: 'CHF', symbol: 'CHF', label: 'Swiss Franc', locale: 'de-CH' },
  { code: 'MXN', symbol: 'MX$', label: 'Mexican Peso', locale: 'es-MX' },
  { code: 'BRL', symbol: 'R$', label: 'Brazilian Real', locale: 'pt-BR' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar', locale: 'en-SG' },
  { code: 'HKD', symbol: 'HK$', label: 'Hong Kong Dollar', locale: 'en-HK' },
  { code: 'SEK', symbol: 'kr', label: 'Swedish Krona', locale: 'sv-SE' },
  { code: 'NOK', symbol: 'kr', label: 'Norwegian Krone', locale: 'nb-NO' },
  { code: 'DKK', symbol: 'kr', label: 'Danish Krone', locale: 'da-DK' },
  { code: 'ZAR', symbol: 'R', label: 'South African Rand', locale: 'en-ZA' },
  { code: 'KRW', symbol: '₩', label: 'South Korean Won', locale: 'ko-KR' },
  { code: 'PHP', symbol: '₱', label: 'Philippine Peso', locale: 'en-PH' },
  { code: 'PLN', symbol: 'zł', label: 'Polish Złoty', locale: 'pl-PL' },
  { code: 'TRY', symbol: '₺', label: 'Turkish Lira', locale: 'tr-TR' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham', locale: 'ar-AE' },
  { code: 'SAR', symbol: '﷼', label: 'Saudi Riyal', locale: 'ar-SA' },
  { code: 'ILS', symbol: '₪', label: 'Israeli Shekel', locale: 'he-IL' },
]

export function getCurrencyMeta(code) {
  return CURRENCIES.find((c) => c.code === code) || CURRENCIES[0]
}

export const SUBSCRIPTION_PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    description: 'Everything you need to get started',
    features: [
      'Debt & budget tracking',
      'Manual transactions',
      'Basic dashboard',
      'Goals tracker',
      'Dark & light mode',
    ],
    cta: 'Current plan',
    highlighted: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 9,
    period: 'month',
    description: 'Smarter insights for growing your money',
    features: [
      'Everything in Free',
      'AI budget & debt insights',
      'Spending charts & reports',
      'Recurring transactions',
      'CSV export',
      'Email-style weekly summary',
    ],
    cta: 'Upgrade to Plus',
    highlighted: true,
    badge: 'Popular',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 15,
    period: 'month',
    description: 'Full power for serious financial growth',
    features: [
      'Everything in Plus',
      'Unlimited AI chat & career coach',
      'Salary benchmark & raise scripts',
      'What-if scenarios & anomaly alerts',
      'Net worth predictions',
      'Priority support',
    ],
    cta: 'Upgrade to Pro',
    highlighted: false,
    badge: 'Best value',
  },
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
