# Upshift — Vercel-only setup

Everything runs on **Vercel** — frontend + API in one project. No other hosts needed.

External services (free tiers): **Supabase**, **Gemini**, **Stripe**

---

## Project structure on Vercel

```
Money/                 ← repo root (connect this in Vercel)
├── vercel.json        ← required — tells Vercel how to build
├── api/               ← serverless API (/api/*)
└── frontend/          ← React app
```

In Vercel: **Root Directory = `.`** (repo root, NOT `frontend`)

---

## Where to put keys

**Local:** `frontend/.env`  
**Production:** Vercel → Project → Settings → Environment Variables

### Public (VITE_ prefix)

| Variable | Source |
|----------|--------|
| `VITE_SUPABASE_URL` | Supabase → API settings |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |

### Secret (no VITE_ prefix)

| Variable | Source |
|----------|--------|
| `SUPABASE_URL` | Same as above |
| `SUPABASE_SERVICE_KEY` | Supabase service_role key |
| `GEMINI_API_KEY` | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| `GEMINI_MODEL` | `gemini-2.0-flash` |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Stripe price ID |

Leave `VITE_API_URL` **empty** — API is on the same domain.

---

## Deploy on Vercel

1. Push repo to GitHub (`tejsonna-star/Money`)
2. [vercel.com](https://vercel.com) → **Add New Project** → import repo
3. **Root Directory:** leave as **`.`** (root) — do NOT set to `frontend`
4. Vercel reads `vercel.json` automatically
5. Add all env vars → Deploy

Live URLs:
- App: `https://your-app.vercel.app`
- API health check: `https://your-app.vercel.app/api/health`

---

## Stripe webhook

```
https://your-app.vercel.app/api/stripe/webhook
```

Snapshot payloads · events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`

---

## Run locally

```bash
cd frontend && npm install && cp .env.example .env
cd .. && npx vercel dev
```

Run `vercel dev` from the **repo root** (where `vercel.json` is).

---

## Supabase

Run `supabase/schema.sql` once in SQL Editor.
