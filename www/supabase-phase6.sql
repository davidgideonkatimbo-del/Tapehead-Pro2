-- Tapehead Pro Phase 6 — end-to-end launch hardening.
-- Run AFTER phases 1-5 and supabase-pro.sql.

-- 1) Message read state must be changed only through a narrow RPC.
-- This prevents a recipient from using a generic UPDATE permission to alter
-- sender, recipient, body, or other message fields.
drop policy if exists "messages mark read" on public.messages;
revoke update on public.messages from anon, authenticated;

create or replace function public.mark_messages_read(p_sender_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  changed integer;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  update public.messages
  set read_at = now()
  where recipient_id = auth.uid()
    and sender_id = p_sender_id
    and read_at is null;
  get diagnostics changed = row_count;
  return changed;
end;
$$;
revoke all on function public.mark_messages_read(uuid) from public, anon;
grant execute on function public.mark_messages_read(uuid) to authenticated;

-- 2) Atomic AI usage consumption. Advisory locking prevents concurrent
-- requests from racing past the hourly limit.
create or replace function public.consume_ai_usage(p_user_id uuid, p_limit integer default 30)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  if p_user_id is null or auth.uid() is distinct from p_user_id then
    raise exception 'AUTH_REQUIRED';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':ai', 0));
  select count(*) into n from public.ai_usage
  where user_id = p_user_id and created_at >= now() - interval '1 hour';
  if n >= greatest(1, least(p_limit, 100)) then return false; end if;
  insert into public.ai_usage(user_id) values (p_user_id);
  return true;
end;
$$;
revoke all on function public.consume_ai_usage(uuid, integer) from public, anon;
grant execute on function public.consume_ai_usage(uuid, integer) to authenticated;

-- 3) Room codes are generated at 8 characters in the client. Keep the
-- database permissive for legacy TH-XXXX rooms already in circulation.
-- New codes are substantially harder to guess than the original 4-character
-- invite codes.

-- 4) Ensure public artist projection exists with only intentionally public data.
-- The view never includes contact, billing state, or account metadata.
create or replace view public.public_profiles as
select id, username, avatar_url, bio, location, genres, links, open_to_collab
from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- 5) No additional database objects are required for local fallback policy.
-- Production deployments should keep cloud mode enabled and disable browser
-- password fallback; the app does this by default when TAPEHEAD_CLOUD.enabled=true.
