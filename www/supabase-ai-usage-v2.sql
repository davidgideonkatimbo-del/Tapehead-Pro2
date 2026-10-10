-- Tapehead AI usage v2 — service-role safe check + record (run after ALL-IN-ONE)
-- Separates quota check from consumption so failed upstream calls do not burn quota.

create or replace function public.check_ai_usage(p_user_id uuid, p_limit integer default 30)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if p_user_id is null then return false; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':ai', 0));
  select count(*) into n from public.ai_usage
  where user_id = p_user_id and created_at >= now() - interval '1 hour';
  return n < greatest(1, least(coalesce(p_limit, 30), 120));
end;
$$;

create or replace function public.record_ai_usage(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then return; end if;
  insert into public.ai_usage(user_id) values (p_user_id);
end;
$$;

-- Keep legacy consume for older clients; make it service-role friendly
create or replace function public.consume_ai_usage(p_user_id uuid, p_limit integer default 30)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
  caller uuid := auth.uid();
begin
  if p_user_id is null then return false; end if;
  -- Allow service_role (caller is null) or the owning user
  if caller is not null and caller is distinct from p_user_id then
    raise exception 'AUTH_REQUIRED';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':ai', 0));
  select count(*) into n from public.ai_usage
  where user_id = p_user_id and created_at >= now() - interval '1 hour';
  if n >= greatest(1, least(coalesce(p_limit, 30), 120)) then return false; end if;
  insert into public.ai_usage(user_id) values (p_user_id);
  return true;
end;
$$;

revoke all on function public.check_ai_usage(uuid, integer) from public, anon, authenticated;
revoke all on function public.record_ai_usage(uuid) from public, anon, authenticated;
revoke all on function public.consume_ai_usage(uuid, integer) from public, anon, authenticated;
grant execute on function public.check_ai_usage(uuid, integer) to service_role;
grant execute on function public.record_ai_usage(uuid) to service_role;
grant execute on function public.consume_ai_usage(uuid, integer) to service_role;
-- authenticated may still consume for their own id (legacy mobile paths)
grant execute on function public.consume_ai_usage(uuid, integer) to authenticated;
