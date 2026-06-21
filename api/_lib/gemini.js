const SYSTEM_PROMPT =
  'You are a personal finance and career advisor for Upshift. Be specific, practical, and direct. No fluff. Always base advice on the user\'s actual numbers. Use plain English. Format currency as USD.'

export async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000 },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error: ${err}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content')
  return text
}

export function buildPrompt(type, data) {
  switch (type) {
    case 'debt_advice':
      return `Analyze these debts and recommend avalanche vs snowball strategy.

Debts: ${JSON.stringify(data.debts)}
Avalanche result: ${data.avalanche.months} months, $${Math.round(data.avalanche.totalInterest)} interest
Snowball result: ${data.snowball.months} months, $${Math.round(data.snowball.totalInterest)} interest
Extra monthly payment: $${data.extraPayment || 0}

Recommend one strategy and explain why in 2-3 paragraphs. Be specific with their numbers.`

    case 'budget_insight':
      return `Analyze this budget and give actionable insight in 2-3 paragraphs.

Monthly income: $${Math.round(data.income)}
Total expenses: $${Math.round(data.totalExpenses)}
Cash flow: $${Math.round(data.cashFlow)}
Rent as % of income: ${data.rentPct?.toFixed(1)}%
Emergency runway: ${data.runway?.toFixed(1)} months
Savings: $${Math.round(data.savings || 0)}
Expenses by category: ${JSON.stringify(data.expenses)}

Flag any categories over recommended thresholds (rent >30%, subscriptions high, etc).`

    case 'raise_script':
      return `Generate a raise negotiation package. Respond in JSON only with this structure:
{"range":"$X – $Y","status":"underpaid|fairly paid|overpaid","script":"full negotiation script paragraph","talkingPoints":["point1","point2","point3"]}

Current salary: $${data.salary}
Job title: ${data.jobTitle}
Years experience: ${data.yearsExperience}
City: ${data.city}
Achievements: ${data.achievements}

Estimate market salary range for this role/city/experience. Note it's an estimate.`

    case 'career_move':
      return `Assess this career move plan. Give a motivational but realistic assessment in 2-3 paragraphs.

Current savings: $${Math.round(data.savings)}
Monthly expenses if quit: $${Math.round(data.monthlyExpenses)}
Target new salary: ${data.targetSalary || 'not specified'}
Current runway: ${data.runway?.toFixed(1)} months
Savings gap: $${Math.round(data.savingsGap)}
Months to savings goal: ${data.monthsToGoal === Infinity ? 'cannot calculate (no surplus)' : data.monthsToGoal}
Current monthly income: $${Math.round(data.income)}`

    case 'dashboard_insight':
      return `Give a 1-2 sentence "next move" insight for this user's dashboard.

Career goal: ${data.careerGoal}
Monthly income: $${Math.round(data.income)}
Total debt: $${Math.round(data.totalDebt)}
Monthly expenses: $${Math.round(data.totalExpenses)}
Cash flow: $${Math.round(data.cashFlow)}
Number of debts: ${data.debtCount}

Be specific and actionable. One clear recommendation.`

    default:
      throw new Error(`Unknown AI type: ${type}`)
  }
}
