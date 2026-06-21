const SYSTEM_PROMPT =
  'You are a personal finance and career advisor for Upshift. Be specific, practical, and direct. No fluff. Always base advice on the user\'s actual numbers. Use plain English. Format currency as USD.'

const MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
].filter(Boolean)

const RETRYABLE_STATUSES = new Set([400, 404, 429])

function parseGeminiError(status, body) {
  let message = body
  try {
    const json = JSON.parse(body)
    message = json.error?.message || body
  } catch {
    // keep raw body
  }

  if (status === 429) {
    return 'Gemini API quota exceeded. Enable billing at ai.google.dev or wait and try again later.'
  }

  if (status === 404) {
    return 'That Gemini model is unavailable on your API key.'
  }

  return String(message).slice(0, 200)
}

function throwIfAllModelsFailed(lastError) {
  if (lastError?.status === 404) {
    throw new Error(
      'No supported Gemini model found. Set GEMINI_MODEL=gemini-2.5-flash in Vercel, then redeploy.'
    )
  }
  throw lastError || new Error('All Gemini models failed')
}

async function requestGeminiContents(model, apiKey, system, contents) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 1000 },
      }),
    }
  )

  if (!response.ok) {
    const errText = await response.text()
    const error = new Error(parseGeminiError(response.status, errText))
    error.status = response.status
    throw error
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Gemini returned no content')
  return text
}

async function requestGemini(model, apiKey, prompt) {
  return requestGeminiContents(model, apiKey, SYSTEM_PROMPT, [
    { role: 'user', parts: [{ text: prompt }] },
  ])
}

export async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is missing on Vercel. Add a separate env var named GEMINI_API_KEY (your Google API key). GEMINI_MODEL should only be the model name, e.g. gemini-2.5-flash. Enable Production, then redeploy.'
    )
  }

  const models = [...new Set(MODELS)]
  let lastError

  for (const model of models) {
    try {
      return await requestGemini(model, apiKey, prompt)
    } catch (err) {
      lastError = err
      if (!RETRYABLE_STATUSES.has(err.status)) throw err
    }
  }

  throwIfAllModelsFailed(lastError)
}

export async function callGeminiChat(message, history = [], context = {}) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is missing on Vercel. Add GEMINI_API_KEY with your Google API key (not in GEMINI_MODEL). Redeploy after saving.'
    )
  }

  const system = `${SYSTEM_PROMPT}

User financial snapshot (use these numbers when relevant):
${JSON.stringify(context, null, 2)}`

  const contents = history.slice(-8).map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }))
  contents.push({ role: 'user', parts: [{ text: message }] })

  const models = [...new Set(MODELS)]
  let lastError

  for (const model of models) {
    try {
      return await requestGeminiContents(model, apiKey, system, contents)
    } catch (err) {
      lastError = err
      if (!RETRYABLE_STATUSES.has(err.status)) throw err
    }
  }

  throwIfAllModelsFailed(lastError)
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

Career goal: ${data.careerGoal || 'not set'}
Monthly income: $${Math.round(data.income)}
Total debt: $${Math.round(data.totalDebt)}
Monthly expenses: $${Math.round(data.totalExpenses)}
Cash flow: $${Math.round(data.cashFlow)}
Number of debts: ${data.debtCount}

Be specific and actionable. One clear recommendation.`

    case 'monthly_report':
      return `Write a concise monthly financial report (3-4 paragraphs) covering spending patterns, savings progress, and 2-3 actionable recommendations.

Income: $${Math.round(data.income)}
Expenses: $${Math.round(data.totalExpenses)}
Cash flow: $${Math.round(data.cashFlow)}
Savings: $${Math.round(data.savings || 0)}
Recent transactions: ${JSON.stringify(data.transactions?.slice(0, 15) || [])}

Use plain English. Highlight wins and areas to improve.`

    case 'what_if':
      return `Analyze this what-if scenario in 2-3 paragraphs.

What if the user cut $${data.cutAmount}/month from ${data.category}?
Current income: $${Math.round(data.income)}
Current monthly expenses: $${Math.round(data.monthlyExpenses)}
Current savings: $${Math.round(data.savings || 0)}
Career goal: ${data.careerGoal || 'not set'}

Show impact on cash flow, savings rate, and goal timeline. Be specific with numbers.`

    case 'weekly_summary':
      return `Write a brief weekly email-style financial summary (2-3 short paragraphs). Friendly tone.

Income: $${Math.round(data.income)}
Expenses this week: $${Math.round(data.weeklyExpenses || 0)}
Cash flow: $${Math.round(data.cashFlow)}
Health score: ${data.healthScore || 50}/100
Streak: ${data.streakDays || 0} days

Highlight one win and one focus area for next week.`

    case 'salary_benchmark':
      return `Provide salary benchmarking for this role. Respond in 2-3 paragraphs with a clear estimated range.

Job title: ${data.jobTitle}
City: ${data.city}
Years experience: ${data.yearsExperience}
Current salary: $${data.salary}

Include market range estimate, whether they appear underpaid, and one negotiation tip. Note estimates vary by source.`

    case 'skills_gap':
      return `Based on their career goal, suggest 3-5 skills to learn and how to start. 2-3 paragraphs.

Career goal: ${data.careerGoal}
Job title: ${data.jobTitle}
Years experience: ${data.yearsExperience}
City: ${data.city}

Be practical and specific.`

    case 'job_offer_compare':
      return `Compare these two job offers side by side. 3-4 paragraphs with a clear recommendation.

Offer A: ${JSON.stringify(data.offerA)}
Offer B: ${JSON.stringify(data.offerB)}
Current monthly expenses: $${Math.round(data.monthlyExpenses || 0)}

Compare total compensation, growth potential, and financial impact.`

    default:
      throw new Error(`Unknown AI type: ${type}`)
  }
}
