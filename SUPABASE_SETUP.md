# Supabase setup (required once)

Schema errors like these mean the database is missing tables or columns:

- **"Could not find the table 'public.profiles'"**
- **"Could not find the table 'public.budget_limits' in the schema cache"**
- **"Could not find the 'subscription_plan' column of 'profiles' in the schema cache"**

## New project (full setup)

1. Go to [supabase.com](https://supabase.com) → open your project  
2. Click **SQL Editor** (left sidebar)  
3. Click **New query**  
4. Copy **everything** from `supabase/schema.sql` in this repo and paste it  
5. Click **Run** (or Cmd+Enter)  
6. You should see **Success**

## Existing project (missing budget_limits or subscription_plan)

If you already ran an older version of the schema, run the patch migration instead:

1. Open **SQL Editor** in Supabase  
2. Copy everything from `supabase/migrations/20250621_fix_missing_schema.sql`  
3. Click **Run**

This adds `budget_limits`, `subscription_plan`, `budget_monthly_snapshots`, and related policies safely (idempotent).

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

Sign up → onboarding → **Skip for now** should work and take you to the dashboard. Category budgets should show all expense categories, and your plan appears above Sign out in the sidebar.
