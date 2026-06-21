export default function handler(_req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.status(200).json({
    status: 'ok',
    gemini: Boolean(process.env.GEMINI_API_KEY),
    supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY),
  })
}
