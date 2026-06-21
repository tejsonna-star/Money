# Upshift

Personal finance + career growth app — **100% on Vercel**.

## Deploy

1. Push to GitHub
2. Vercel → New Project → import repo
3. **Root directory: `.`** (repo root)
4. Add env vars from `frontend/.env.example`
5. Deploy

See **[ENV_SETUP.md](./ENV_SETUP.md)** for all keys and Stripe webhook setup.

## Local dev

```bash
npx vercel dev    # run from repo root
```

## Stack

| Layer | Service |
|-------|---------|
| Frontend + API | Vercel |
| Database | Supabase |
| AI | Gemini |
| Payments | Stripe |
