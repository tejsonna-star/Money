-- Run this in Supabase SQL Editor if you see errors like:
--   "Could not find the table 'public.budget_limits' in the schema cache"
--   "Could not find the 'subscription_plan' column of 'profiles' in the schema cache"
-- Safe to run multiple times (idempotent).

-- Profiles columns added after initial deploy
alter table profiles add column if not exists currency text default 'USD';
alter table profiles add column if not exists subscription_plan text default 'free';
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists notification_prefs jsonb default '{"budget_alerts": true, "weekly_summary": true}';
alter table profiles add column if not exists onboarding_checklist jsonb default '{}';

-- Budget limits table
create table if not exists budget_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  category text not null,
  monthly_limit numeric not null default 0,
  created_at timestamp with time zone default now(),
  unique (user_id, category)
);

alter table budget_limits add column if not exists rollover_balance numeric default 0;

alter table budget_limits enable row level security;

drop policy if exists "Users can view own budget_limits" on budget_limits;
drop policy if exists "Users can insert own budget_limits" on budget_limits;
drop policy if exists "Users can update own budget_limits" on budget_limits;
drop policy if exists "Users can delete own budget_limits" on budget_limits;

create policy "Users can view own budget_limits" on budget_limits
  for select using (auth.uid() = user_id);
create policy "Users can insert own budget_limits" on budget_limits
  for insert with check (auth.uid() = user_id);
create policy "Users can update own budget_limits" on budget_limits
  for update using (auth.uid() = user_id);
create policy "Users can delete own budget_limits" on budget_limits
  for delete using (auth.uid() = user_id);

-- Budget monthly snapshots
create table if not exists budget_monthly_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  category text not null,
  month_key text not null,
  spent numeric default 0,
  limit_amount numeric default 0,
  rollover_in numeric default 0,
  unique (user_id, category, month_key)
);

alter table budget_monthly_snapshots enable row level security;

drop policy if exists "Users can manage own budget snapshots" on budget_monthly_snapshots;
create policy "Users can manage own budget snapshots" on budget_monthly_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Backfill subscription_plan for existing users
update profiles set subscription_plan = 'free' where subscription_plan is null;

-- Ensure new users get subscription_plan on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, subscription_status, subscription_plan, onboarding_complete)
  values (new.id, 'free', 'free', false)
  on conflict (id) do nothing;
  return new;
end;
$$;
