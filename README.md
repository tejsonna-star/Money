# Upshift

AI-powered personal finance and career growth platform. Help working adults get out of debt faster, know what they're worth, and grow their income.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS → Vercel
- **Backend:** Node.js + Express → Render
- **Database:** Supabase (Postgres + Auth)
- **AI:** Google Gemini (gemini-2.0-flash)
- **Payments:** Stripe ($15/mo, 7-day trial)

## Quick Start

### 1. Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy your project URL and keys

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_STRIPE_PUBLISHABLE_KEY
npm install
npm run dev
```

### 3. Backend

```bash
cd backend
cp .env.example .env
# Fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, GEMINI_API_KEY, STRIPE keys
npm install
npm run dev
```

### 4. Stripe Setup

1. Create product **Upshift Pro** at $15/month recurring
2. Copy the Price ID to `STRIPE_PRICE_ID`
3. Set up webhook endpoint: `https://your-api.onrender.com/api/stripe/webhook`
4. Listen for: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

## Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel
```

Set environment variables in Vercel dashboard. Set `VITE_API_URL` to your Render backend URL.

### Backend (Render)

1. Push your repo to GitHub
2. Go to [render.com](https://render.com) → **New** → **Blueprint** → connect repo (uses `render.yaml`)
   - Or: **New Web Service** → root directory **`backend`**, start command **`npm start`**
3. Add all backend env vars from `backend/.env.example`
4. Set `FRONTEND_URL` to your Vercel URL
5. Copy your Render URL (e.g. `https://upshift-api.onrender.com`) → paste into Vercel as `VITE_API_URL`
6. Stripe webhook: `https://upshift-api.onrender.com/api/stripe/webhook`

## Project Structure

```
upshift/
├── frontend/          # React + Vite app
├── backend/           # Express API
├── supabase/          # Database schema
└── README.md
```

## Features

- **Landing page** — Marketing site with pricing
- **Auth** — Email/password via Supabase
- **Onboarding** — 4-step setup (income, debts, expenses, career goal)
- **Dashboard** — Net worth, cash flow, debt progress, AI insights
- **Debt Tracker** — Avalanche vs snowball strategies + AI recommendation
- **Budget** — Spending breakdown, runway calculator, AI insights
- **Career Coach** — Raise negotiator + career move calculator
- **Settings** — Subscription management via Stripe

## Design

- Background: `#0A0A0F`
- Accent: `#6C63FF` (indigo)
- Secondary: `#00E5A0` (mint)
- Fonts: Inter (body), Syne (headings)
