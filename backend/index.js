const express = require('express')
const cors = require('cors')
require('dotenv').config()

const aiRoutes = require('./routes/ai')
const stripeRoutes = require('./routes/stripe')
const userRoutes = require('./routes/user')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))

app.use('/api/stripe/webhook', express.raw({ type: 'application/json' }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'upshift-api' })
})

app.use('/api/ai', aiRoutes)
app.use('/api/stripe', stripeRoutes)
app.use('/api/user', userRoutes)

app.listen(PORT, () => {
  console.log(`Upshift API running on port ${PORT}`)
})
