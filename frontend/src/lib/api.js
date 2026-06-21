const API_BASE = import.meta.env.VITE_API_URL || ''

async function parseApiError(res) {
  const text = await res.text()
  try {
    const json = JSON.parse(text)
    return json.error || text
  } catch {
    if (text.includes('<!DOCTYPE') || text.includes('<html')) {
      return `API not reachable (${res.status}). Check Vercel env vars GEMINI_API_KEY + SUPABASE_SERVICE_KEY, then redeploy.`
    }
    return text.slice(0, 200) || `Request failed (${res.status})`
  }
}

export async function callAI(type, data, token) {
  const res = await fetch(`${API_BASE}/api/ai`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ type, data }),
  })
  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }
  const json = await res.json()
  return json.result
}

export async function sendChatMessage(message, history, context, token) {
  const res = await fetch(`${API_BASE}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ message, history, context }),
  })
  if (!res.ok) {
    throw new Error(await parseApiError(res))
  }
  const json = await res.json()
  return json.reply
}

export async function createCheckoutSession(token) {
  const res = await fetch(`${API_BASE}/api/stripe/create-checkout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Failed to create checkout session')
  return res.json()
}

export async function createPortalSession(token) {
  const res = await fetch(`${API_BASE}/api/stripe/create-portal`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Failed to create portal session')
  return res.json()
}

export async function getSubscriptionStatus(token) {
  const res = await fetch(`${API_BASE}/api/stripe/subscription`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  if (!res.ok) throw new Error('Failed to get subscription')
  return res.json()
}

export function calculateDebtPayoff(debts, extraPayment = 0, strategy = 'avalanche') {
  if (!debts.length) {
    return { months: 0, totalInterest: 0, schedule: [] }
  }

  const sorted = [...debts].map(d => ({
    name: d.name,
    balance: Number(d.balance),
    rate: Number(d.interest_rate) / 100 / 12,
    minPayment: Number(d.minimum_payment),
  }))

  if (strategy === 'avalanche') {
    sorted.sort((a, b) => b.rate - a.rate)
  } else {
    sorted.sort((a, b) => a.balance - b.balance)
  }

  const working = sorted.map(d => ({ ...d }))
  let month = 0
  let totalInterest = 0
  const schedule = []
  const maxMonths = 600

  while (working.some(d => d.balance > 0.01) && month < maxMonths) {
    month++
    let available = Number(extraPayment) || 0
    let monthInterest = 0
    let monthPrincipal = 0

    for (const debt of working) {
      if (debt.balance <= 0) continue
      const interest = debt.balance * debt.rate
      monthInterest += interest
      totalInterest += interest
      debt.balance += interest
      const payment = Math.min(debt.minPayment, debt.balance)
      debt.balance -= payment
      monthPrincipal += payment
    }

    for (const debt of working) {
      if (debt.balance <= 0 || available <= 0) continue
      const payment = Math.min(available, debt.balance)
      debt.balance -= payment
      monthPrincipal += payment
      available -= payment
      if (debt.balance <= 0.01) {
        debt.balance = 0
        break
      }
    }

    schedule.push({
      month,
      interest: monthInterest,
      principal: monthPrincipal,
      remaining: working.reduce((s, d) => s + Math.max(d.balance, 0), 0),
    })
  }

  return { months: month, totalInterest, schedule }
}
