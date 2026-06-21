import { requireAuth, sendError } from './_lib/auth.js'
import { callGeminiChat } from './_lib/gemini.js'

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

    const { message, history, context } = body
    if (!message?.trim()) {
      return res.status(400).json({ error: 'message required' })
    }

    const reply = await callGeminiChat(message, history || [], context || {})
    return res.status(200).json({ reply })
  } catch (err) {
    console.error('Chat error:', err.message)
    sendError(res, err)
  }
}
