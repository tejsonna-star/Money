# Supabase setup (required once)

The error **"Could not find the table 'public.profiles'"** means you haven't created the database tables yet.

## Steps (5 minutes)

1. Go to [supabase.com](https://supabase.com) → open your project  
2. Click **SQL Editor** (left sidebar)  
3. Click **New query**  
4. Copy **everything** from `supabase/schema.sql` in this repo and paste it  
5. Click **Run** (or Cmd+Enter)  
6. You should see **Success**

## Then in Supabase

**Authentication → URL Configuration**

| Field | Value |
|-------|--------|
| Site URL | `https://money-five-ecru.vercel.app` |
| Redirect URLs | `https://money-five-ecru.vercel.app/**` |

## Then in Vercel → Environment Variables

| Variable | Where |
|----------|--------|
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_URL` | same Project URL |
| `SUPABASE_SERVICE_KEY` | service_role key (secret) |

Redeploy on Vercel after adding vars.

## Try again

Sign up → onboarding → **Skip for now** should work and take you to the dashboard.
