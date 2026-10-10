-- Tapehead Pro: server-authoritative Pro entitlements and payment records.
-- Run this in Supabase SQL Editor before enabling production payments.

create table if not exists public.pro_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('trial','month','year','lifetime')),
  status text not null default 'active' check (status in ('active','revoked','expired')),
  source text not null default 'payment',
  provider text,
  provider_tx_id text,
  tx_ref text,
  amount numeric(12,2),
  currency text,
  started_at timestamptz not null default now(),
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

create unique index if not exists pro_entitlements_provider_tx_idx on public.pro_entitlements(provider, provider_tx_id) where provider_tx_id is not null;
create index if not exists pro_entitlements_status_idx on public.pro_entitlements(status, expires_at);

create table if not exists public.pro_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tx_ref text not null unique,
  plan text not null check (plan in ('month','year','lifetime')),
  amount numeric(12,2) not null,
  currency text not null,
  status text not null default 'pending' check (status in ('pending','successful','failed')),
  provider_transaction_id text,
  provider_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pro_transactions_user_idx on public.pro_transactions(user_id, created_at desc);
create unique index if not exists pro_transactions_provider_id_idx on public.pro_transactions(provider_transaction_id) where provider_transaction_id is not null;

alter table public.pro_entitlements enable row level security;
alter table public.pro_transactions enable row level security;

drop policy if exists "pro entitlement read own" on public.pro_entitlements;
create policy "pro entitlement read own" on public.pro_entitlements for select using (auth.uid() = user_id);

drop policy if exists "pro transactions read own" on public.pro_transactions;
create policy "pro transactions read own" on public.pro_transactions for select using (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE policies are intentional. Serverless functions use the service role.
