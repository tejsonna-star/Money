import { requireAuth, sendError } from './_lib/auth.js'
import { callGemini, buildPrompt } from './_lib/gemini.js'

export const config = {
  api: { bodyParser: true },
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return {}
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = await readBody(req)
    await requireAuth(req)

    const { type, data } = body
    if (!type || !data) {
      return res.status(400).json({ error: 'type and data required' })
    }

    const prompt = buildPrompt(type, data)
    let result = await callGemini(prompt)

    if (type === 'raise_script') {
      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) result = JSON.parse(jsonMatch[0])
      } catch {
        // keep as string
      }
    }

    return res.status(200).json({ result })
  } catch (err) {
    console.error('AI error:', err.message)
    sendError(res, err)
  }
}
