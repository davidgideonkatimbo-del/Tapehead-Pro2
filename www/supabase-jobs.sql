-- Tapehead durable jobs — run after supabase-ALL-IN-ONE.sql
-- Pattern aligned with production-grade claim + stale recovery.

create table if not exists public.tapehead_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('ai_generate','bounce','export','stem_render')),
  status text not null default 'queued'
    check (status in ('queued','running','succeeded','failed','canceled')),
  priority int not null default 5,
  payload jsonb not null default '{}'::jsonb,
  result jsonb,
  error text,
  attempts int not null default 0,
  worker_id text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  expires_at timestamptz
);

create index if not exists tapehead_jobs_claim_idx
  on public.tapehead_jobs (status, priority, created_at)
  where status = 'queued';

create index if not exists tapehead_jobs_user_idx
  on public.tapehead_jobs (user_id, created_at desc);

alter table public.tapehead_jobs enable row level security;

drop policy if exists "users read own jobs" on public.tapehead_jobs;
create policy "users read own jobs" on public.tapehead_jobs
  for select using (auth.uid() = user_id);

-- Jobs are created ONLY by the API (service_role) so usage limits, payload checks and the
-- open-job cap cannot be bypassed. Users may read their own jobs, nothing else.
drop policy if exists "users insert own jobs" on public.tapehead_jobs;
revoke insert, update, delete on public.tapehead_jobs from anon, authenticated;
grant select on public.tapehead_jobs to authenticated;

-- Claim function: service_role only (SECURITY DEFINER)
create or replace function public.claim_tapehead_job(p_worker_id text, p_kinds text[] default null)
returns public.tapehead_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  job public.tapehead_jobs;
begin
  -- Recover stale running jobs (> 15 min)
  update public.tapehead_jobs
  set status = case when attempts >= 3 then 'failed' else 'queued' end,
      error = case when attempts >= 3 then 'stale worker timeout' else error end,
      worker_id = null,
      started_at = null
  where status = 'running'
    and started_at < now() - interval '15 minutes';

  select * into job
  from public.tapehead_jobs
  where status = 'queued'
    and (p_kinds is null or kind = any(p_kinds))
  order by priority asc, created_at asc
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  update public.tapehead_jobs
  set status = 'running',
      worker_id = p_worker_id,
      started_at = now(),
      attempts = attempts + 1
  where id = job.id
  returning * into job;

  return job;
end;
$$;

revoke all on function public.claim_tapehead_job(text, text[]) from public, anon, authenticated;
grant execute on function public.claim_tapehead_job(text, text[]) to service_role;
