-- Upshift Database Schema
-- Run this in your Supabase SQL Editor

create table profiles (
  id uuid references auth.users primary key,
  salary numeric,
  pay_frequency text,
  career_goal text,
  savings numeric default 0,
  job_title text,
  years_experience numeric,
  city text,
  stripe_customer_id text,
  subscription_status text default 'trialing',
  onboarding_complete boolean default false,
  created_at timestamp with time zone default now()
);

create table debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  balance numeric not null default 0,
  interest_rate numeric not null default 0,
  minimum_payment numeric not null default 0,
  created_at timestamp with time zone default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  category text not null,
  amount numeric not null default 0,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;
alter table debts enable row level security;
alter table expenses enable row level security;

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
