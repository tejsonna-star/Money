export function computeNetWorthFromAccounts(accounts, debts = []) {
  const accountTotal = accounts.reduce((sum, a) => {
    const bal = Number(a.balance) || 0
    return a.type === 'credit' ? sum - bal : sum + bal
  }, 0)
  const debtTotal = debts.reduce((s, d) => s + Number(d.balance), 0)
  return accountTotal - debtTotal
}

export function calculateRoundUpSavings(transactions) {
  return transactions
    .filter((t) => t.type === 'expense' && !t.parent_id)
    .reduce((sum, t) => {
      const amt = Number(t.amount)
      const rounded = Math.ceil(amt)
      return sum + (rounded - amt)
    }, 0)
}

export function projectGoalCompletion(goal, monthlyContribution) {
  const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount))
  if (remaining <= 0) return { months: 0, date: new Date() }
  if (!monthlyContribution || monthlyContribution <= 0) return { months: Infinity, date: null }
  const months = Math.ceil(remaining / monthlyContribution)
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return { months, date }
}

export function detectAnomalies(transactions) {
  const expenses = transactions.filter((t) => t.type === 'expense' && !t.parent_id)
  const byCategory = {}
  expenses.forEach((t) => {
    byCategory[t.category] = byCategory[t.category] || []
    byCategory[t.category].push(Number(t.amount))
  })

  const anomalies = []
  expenses.forEach((t) => {
    const amounts = byCategory[t.category] || []
    if (amounts.length < 3) return
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length
    if (Number(t.amount) > avg * 2) {
      anomalies.push({
        id: t.id,
        category: t.category,
        amount: Number(t.amount),
        average: avg,
        date: t.transaction_date,
        note: t.note,
      })
    }
  })
  return anomalies.slice(0, 10)
}

export function predictNetWorth(history) {
  if (!history || history.length < 2) return null
  const points = history.map((h) => Number(h.net_worth))
  const n = points.length
  const avgDelta = (points[n - 1] - points[0]) / (n - 1)
  const projected = points[n - 1] + avgDelta * 3
  return { current: points[n - 1], projected3mo: Math.round(projected), monthlyTrend: Math.round(avgDelta) }
}

export function calculateHealthScore({ cashFlow, runway, debtToIncome, budgetAdherence, streakDays }) {
  let score = 50
  if (cashFlow > 0) score += 15
  else score -= 10
  if (runway >= 6) score += 15
  else if (runway >= 3) score += 8
  else score -= 5
  if (debtToIncome < 0.2) score += 10
  else if (debtToIncome > 0.5) score -= 10
  if (budgetAdherence >= 0.9) score += 10
  if (streakDays >= 7) score += 10
  else if (streakDays >= 3) score += 5
  return Math.min(100, Math.max(0, Math.round(score)))
}

export function computeBadges({ goals, debts, runway, streakDays, gamification }) {
  const existing = gamification?.badges || []
  const badges = new Set(existing)
  if (goals.some((g) => Number(g.current_amount) >= Number(g.target_amount))) badges.add('first_goal')
  if (debts.length > 0 && debts.every((d) => Number(d.balance) <= 0)) badges.add('debt_free')
  if (runway >= 3) badges.add('emergency_3mo')
  if (streakDays >= 7) badges.add('streak_7')
  return [...badges]
}

export function applyBudgetRollover(limits, categorySpending) {
  return limits.map((limit) => {
    const spent = categorySpending[limit.category] || 0
    const effective = Number(limit.monthly_limit) + Number(limit.rollover_balance || 0)
    const remaining = effective - spent
    const nextRollover = remaining > 0 ? remaining : 0
    return { ...limit, spent, effective, nextRollover, overBudget: spent > effective }
  })
}

export function exportTransactionsCsv(transactions) {
  const header = 'Date,Type,Category,Amount,Note,Recurring\n'
  const rows = transactions
    .filter((t) => !t.parent_id)
    .map((t) => [
      t.transaction_date,
      t.type,
      `"${t.category}"`,
      t.amount,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      t.is_recurring ? t.recurring_frequency : '',
    ].join(','))
  return header + rows.join('\n')
}

export function exportUserDataJson(data) {
  return JSON.stringify(data, null, 2)
}
