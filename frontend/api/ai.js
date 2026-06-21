import { requireAuth, sendError } from './_lib/auth.js'
import { callGemini, buildPrompt } from './_lib/gemini.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { user } = await requireAuth(req)

    const { type, data } = req.body
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
        // keep as string if parse fails
      }
    }

    res.status(200).json({ result })
  } catch (err) {
    console.error('AI error:', err.message)
    sendError(res, err)
  }
}
