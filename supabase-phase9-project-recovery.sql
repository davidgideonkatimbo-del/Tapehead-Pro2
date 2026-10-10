-- Tapehead Pro Phase 9: full project snapshots + owner-only version history.
-- Run once in Supabase SQL Editor before deploying v1.11.4.

alter table public.projects add column if not exists project_data jsonb not null default '{}'::jsonb;

create table if not exists public.project_versions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id text not null references public.projects(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, project_id, version_number)
);
create index if not exists project_versions_owner_project_idx
  on public.project_versions(user_id, project_id, version_number desc);
alter table public.project_versions enable row level security;
revoke all on public.project_versions from anon;
revoke all on public.project_versions from public, anon;
grant select on public.project_versions to authenticated;
revoke insert, update, delete on public.project_versions from authenticated;
drop policy if exists "project versions read own" on public.project_versions;
create policy "project versions read own" on public.project_versions
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.snapshot_tapehead_project()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  next_version integer;
  snapshot_row jsonb;
begin
  if TG_OP = 'UPDATE' and to_jsonb(new) = to_jsonb(old) then
    return new;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text || ':' || new.id::text || ':project-version', 0));
  select coalesce(max(version_number), 0) + 1 into next_version
    from public.project_versions
    where user_id = new.user_id and project_id = new.id;
  snapshot_row := to_jsonb(new);
  insert into public.project_versions(user_id, project_id, version_number, snapshot)
    values (new.user_id, new.id, next_version, snapshot_row);
  delete from public.project_versions
    where user_id = new.user_id and project_id = new.id
      and version_number <= next_version - 20;
  return new;
end;
$$;
revoke all on function public.snapshot_tapehead_project() from public, anon, authenticated;
drop trigger if exists tapehead_project_version_snapshot on public.projects;
create trigger tapehead_project_version_snapshot
after insert or update on public.projects
for each row execute function public.snapshot_tapehead_project();

comment on column public.projects.project_data is 'Complete Tapehead client project snapshot; keeps new mixer/arrangement fields durable across devices.';
comment on table public.project_versions is 'Owner-only rolling history of up to 20 saved versions per project.';
