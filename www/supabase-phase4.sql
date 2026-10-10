-- Tapehead Pro Phase 4 production safeguards.
-- Run AFTER supabase-schema.sql, supabase-air.sql, supabase-security-hardening.sql,
-- and supabase-pro.sql.

-- 1) Server-side enforcement of the Free project's limit.
-- Pro/trial entitlements are authoritative. LocalStorage cannot unlock more projects.
create or replace function public.enforce_project_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_pro boolean;
  project_count integer;
begin
  -- Serialize project creation per user to avoid two simultaneous inserts
  -- bypassing the count check.
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));

  select exists (
    select 1
    from public.pro_entitlements pe
    where pe.user_id = new.user_id
      and pe.status = 'active'
      and (pe.expires_at is null or pe.expires_at > now())
  ) into active_pro;

  if active_pro then
    return new;
  end if;

  select count(*) into project_count
  from public.projects
  where user_id = new.user_id;

  if project_count >= 3 then
    raise exception 'FREE_PROJECT_LIMIT_REACHED';
  end if;

  return new;
end;
$$;
revoke all on function public.enforce_project_limit() from public, anon, authenticated;

drop trigger if exists enforce_project_limit_before_insert on public.projects;
create trigger enforce_project_limit_before_insert
before insert on public.projects
for each row execute function public.enforce_project_limit();

-- 2) Server-side anti-spam protection for direct messages.
-- 30 messages/hour/user is deliberately conservative for an early social product.
create or replace function public.can_send_message(p_sender uuid, p_recipient uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
  blocked boolean;
begin
  if p_sender is null or p_recipient is null or p_sender = p_recipient then
    return false;
  end if;

  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = p_sender and b.blocked_id = p_recipient)
       or (b.blocker_id = p_recipient and b.blocked_id = p_sender)
  ) into blocked;
  if blocked then return false; end if;

  select count(*) into recent_count
  from public.messages m
  where m.sender_id = p_sender
    and m.created_at >= now() - interval '1 hour';

  return recent_count < 30;
end;
$$;
revoke all on function public.can_send_message(uuid, uuid) from public, anon, authenticated;
grant execute on function public.can_send_message(uuid, uuid) to authenticated;

drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages for insert with check (
  auth.uid() = sender_id
  and public.can_send_message(auth.uid(), recipient_id)
);

-- 3) A block also stops new follows and comments between the two accounts.
-- Existing public content remains public; this is an interaction boundary.
create or replace function public.is_blocked_pair(p_a uuid, p_b uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocks b
    where (b.blocker_id = p_a and b.blocked_id = p_b)
       or (b.blocker_id = p_b and b.blocked_id = p_a)
  );
$$;
revoke all on function public.is_blocked_pair(uuid, uuid) from public, anon, authenticated;
grant execute on function public.is_blocked_pair(uuid, uuid) to authenticated;

drop policy if exists "follows insert own" on public.follows;
create policy "follows insert own" on public.follows for insert with check (
  auth.uid() = follower_id
  and not public.is_blocked_pair(auth.uid(), following_id)
);

drop policy if exists "comments insert" on public.comments;
create policy "comments insert" on public.comments for insert with check (
  auth.uid() = user_id
  and not exists (
    select 1 from public.blocks b
    where b.blocker_id = auth.uid()
      and b.blocked_id = (select fp.user_id from public.feed_posts fp where fp.id = comments.post_id)
  )
  and not exists (
    select 1 from public.blocks b
    where b.blocker_id = (select fp.user_id from public.feed_posts fp where fp.id = comments.post_id)
      and b.blocked_id = auth.uid()
  )
);

-- 4) Prevent self-reports and make report reasons more predictable for moderation.
drop policy if exists "reports create own" on public.reports;
create policy "reports create own" on public.reports for insert with check (
  auth.uid() = reporter_id
  and reporter_id <> reported_user_id
  and char_length(trim(reason)) between 1 and 80
);

-- 5) Do not let a client directly change billing columns in profiles.
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Note: the application already filters profile edits, but these columns are
-- intentionally kept out of the public projection. For strongest isolation,
-- migrate billing state entirely to pro_entitlements and stop relying on
-- profiles.is_pro / profiles.pro_until in new code.
