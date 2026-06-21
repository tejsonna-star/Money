-- Upshift Database Schema
-- Run this in your Supabase SQL Editor

create table if not exists profiles (
  id uuid references auth.users primary key,
  salary numeric,
  pay_frequency text,
  career_goal text,
  savings numeric default 0,
  job_title text,
  years_experience numeric,
  city text,
  stripe_customer_id text,
  subscription_status text default 'free',
  onboarding_complete boolean default false,
  created_at timestamp with time zone default now()
);

create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  balance numeric not null default 0,
  original_balance numeric,
  interest_rate numeric not null default 0,
  minimum_payment numeric not null default 0,
  created_at timestamp with time zone default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  category text not null,
  amount numeric not null default 0,
  created_at timestamp with time zone default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  amount numeric not null,
  category text not null,
  type text not null check (type in ('income', 'expense')),
  transaction_date date not null default current_date,
  note text,
  created_at timestamp with time zone default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  target_amount numeric not null,
  current_amount numeric not null default 0,
  deadline date,
  created_at timestamp with time zone default now()
);

create table if not exists budget_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  category text not null,
  monthly_limit numeric not null default 0,
  created_at timestamp with time zone default now(),
  unique (user_id, category)
);

create table if not exists net_worth_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  net_worth numeric not null,
  recorded_at date not null default current_date,
  created_at timestamp with time zone default now(),
  unique (user_id, recorded_at)
);

-- Backfill column for existing installs
alter table debts add column if not exists original_balance numeric;
update debts set original_balance = balance where original_balance is null;

alter table profiles enable row level security;
alter table debts enable row level security;
alter table expenses enable row level security;
alter table transactions enable row level security;
alter table goals enable row level security;
alter table budget_limits enable row level security;
alter table net_worth_snapshots enable row level security;

create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Users can insert own profile" on profiles
  for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Users can view own debts" on debts
  for select using (auth.uid() = user_id);
create policy "Users can insert own debts" on debts
  for insert with check (auth.uid() = user_id);
create policy "Users can update own debts" on debts
  for update using (auth.uid() = user_id);
create policy "Users can delete own debts" on debts
  for delete using (auth.uid() = user_id);

create policy "Users can view own expenses" on expenses
  for select using (auth.uid() = user_id);
create policy "Users can insert own expenses" on expenses
  for insert with check (auth.uid() = user_id);
create policy "Users can update own expenses" on expenses
  for update using (auth.uid() = user_id);
create policy "Users can delete own expenses" on expenses
  for delete using (auth.uid() = user_id);

create policy "Users can view own transactions" on transactions
  for select using (auth.uid() = user_id);
create policy "Users can insert own transactions" on transactions
  for insert with check (auth.uid() = user_id);
create policy "Users can update own transactions" on transactions
  for update using (auth.uid() = user_id);
create policy "Users can delete own transactions" on transactions
  for delete using (auth.uid() = user_id);

create policy "Users can view own goals" on goals
  for select using (auth.uid() = user_id);
create policy "Users can insert own goals" on goals
  for insert with check (auth.uid() = user_id);
create policy "Users can update own goals" on goals
  for update using (auth.uid() = user_id);
create policy "Users can delete own goals" on goals
  for delete using (auth.uid() = user_id);

create policy "Users can view own budget_limits" on budget_limits
  for select using (auth.uid() = user_id);
create policy "Users can insert own budget_limits" on budget_limits
  for insert with check (auth.uid() = user_id);
create policy "Users can update own budget_limits" on budget_limits
  for update using (auth.uid() = user_id);
create policy "Users can delete own budget_limits" on budget_limits
  for delete using (auth.uid() = user_id);

create policy "Users can view own net_worth_snapshots" on net_worth_snapshots
  for select using (auth.uid() = user_id);
create policy "Users can insert own net_worth_snapshots" on net_worth_snapshots
  for insert with check (auth.uid() = user_id);
create policy "Users can update own net_worth_snapshots" on net_worth_snapshots
  for update using (auth.uid() = user_id);
create policy "Users can delete own net_worth_snapshots" on net_worth_snapshots
  for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, subscription_status, onboarding_complete)
  values (new.id, 'free', false)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
