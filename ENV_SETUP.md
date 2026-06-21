# Upshift — Environment Setup Guide

## Where to put your keys

### Local development

| File | What goes here |
|------|----------------|
| `frontend/.env` | Supabase public keys + Stripe publishable key |
| `backend/.env` | Supabase service key, Gemini key, Stripe secret keys |

Copy the examples first:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

---

### Frontend — `frontend/.env`

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3001
```

**Where to get these:**
- **Supabase URL + anon key** → [supabase.com](https://supabase.com) → your project → Settings → API
- **Stripe publishable key** → [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → API keys → Publishable key

For **production (Vercel)**, set the same variables in the Vercel dashboard, but change:
```env
VITE_API_URL=https://upshift-api.onrender.com
```
(Use your actual Render service URL.)

---

### Backend — `backend/.env`

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_KEY=eyJ...your-service-role-key
GEMINI_API_KEY=AIza...your-gemini-key
GEMINI_MODEL=gemini-2.0-flash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
FRONTEND_URL=http://localhost:5180
PORT=3001
```

**Where to get these:**
- **Supabase service key** → Supabase → Settings → API → `service_role` key (keep secret!)
- **Gemini API key** → [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- **Stripe secret key** → Stripe dashboard → Developers → API keys → Secret key
- **Stripe Price ID** → Stripe → Products → Upshift Pro → copy the Price ID
- **Stripe webhook secret** → Stripe → Developers → Webhooks → add endpoint → copy signing secret

For **production (Render)**, set the same variables in the Render dashboard, but change:
```env
FRONTEND_URL=https://your-app.vercel.app
```
Render sets `PORT` automatically — you don't need to add it.

---

## Run locally

Frontend runs on **http://localhost:5180** (falls back to next free port if busy).

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

Open **http://localhost:5180**

---

## Deploy

### Frontend → Vercel

```bash
cd frontend
vercel --prod
```

Add these env vars in Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_API_URL` → your Render backend URL

### Backend → Render

**Option A — Blueprint (easiest, uses `render.yaml` in repo root):**

1. Push repo to GitHub
2. [render.com](https://render.com) → **New** → **Blueprint**
3. Connect your repo — Render reads `render.yaml` automatically
4. Fill in secret env vars when prompted
5. Deploy

**Option B — Manual Web Service:**

1. [render.com](https://render.com) → **New** → **Web Service**
2. Connect GitHub repo
3. Settings:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Health check path:** `/api/health`
4. Add all env vars from `backend/.env.example`
5. Deploy → copy URL (e.g. `https://upshift-api.onrender.com`)

**After Render deploys:**

1. Paste Render URL into Vercel as `VITE_API_URL`
2. Set `FRONTEND_URL` on Render to your Vercel URL
3. Stripe webhook endpoint:
   ```
   https://upshift-api.onrender.com/api/stripe/webhook
   ```
   - Payload: **Snapshot**
   - Events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy webhook signing secret → Render env var `STRIPE_WEBHOOK_SECRET`

> **Note:** Render free tier spins down after inactivity. First request may take ~30s to wake up. Upgrade to a paid plan for always-on.

### Supabase (one-time)

Run `supabase/schema.sql` in Supabase SQL Editor before first use.

---

## Quick checklist

- [ ] Supabase project created, schema run
- [ ] `frontend/.env` filled in
- [ ] `backend/.env` filled in (including Gemini key)
- [ ] Backend running on port 3001 locally
- [ ] Frontend running on port 5180 locally
- [ ] Vercel deployed with env vars
- [ ] Render deployed with env vars
- [ ] Stripe webhook pointed at Render URL
