const express = require('express')
const { authMiddleware, supabase } = require('../middleware/auth')

const router = express.Router()

router.get('/profile', authMiddleware, async (req, res) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single()

  if (error) return res.status(404).json({ error: 'Profile not found' })
  res.json(data)
})

router.patch('/profile', authMiddleware, async (req, res) => {
  const allowed = [
    'salary', 'pay_frequency', 'career_goal', 'savings',
    'job_title', 'years_experience', 'city',
  ]
  const updates = {}
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', req.user.id)
    .select()
    .single()

  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

module.exports = router
