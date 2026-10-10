-- Tapehead jobs hotfix: stop signed-in users from writing job rows directly.
-- It touches ONE table only: public.tapehead_jobs. Nothing else in the database is read or changed.
-- If that table is not in the project you are connected to (for example you opened Avirzo by mistake),
-- or it does not look like Tapehead's jobs table, this does nothing and prints a notice.
-- Safe to re-run.

do $$
begin
  if to_regclass('public.tapehead_jobs') is null then
    raise notice 'public.tapehead_jobs not found in this database - nothing changed.';
    return;
  end if;

  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'tapehead_jobs' and column_name = 'kind')
     or not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'tapehead_jobs' and column_name = 'payload') then
    raise notice 'public.tapehead_jobs does not look like the Tapehead jobs table - nothing changed.';
    return;
  end if;

  execute 'drop policy if exists "users insert own jobs" on public.tapehead_jobs';
  execute 'revoke insert, update, delete on public.tapehead_jobs from anon, authenticated';
  execute 'grant select on public.tapehead_jobs to authenticated';
  raise notice 'public.tapehead_jobs locked down: users can read their own jobs only.';
end
$$;

-- Optional check (read-only). Expect one row: users read own jobs / SELECT. No INSERT policy.
-- select policyname, cmd from pg_policies where schemaname = 'public' and tablename = 'tapehead_jobs';
