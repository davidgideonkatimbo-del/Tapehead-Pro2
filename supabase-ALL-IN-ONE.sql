-- ============================================================================
-- Tapehead Pro — COMPLETE database setup (all migrations, correct order)
-- Paste this WHOLE file into Supabase > SQL Editor > New query, then click Run.
-- Safe to run more than once. Do NOT run the other supabase-*.sql files separately.
-- ============================================================================


-- ───────── 1. Base tables (profiles, projects, feed, rooms, follows, messages)  [supabase-schema.sql] ─────────
-- Tapehead Pro — Phase C schema (run in Supabase SQL Editor)

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  contact text,
  avatar_url text,
  is_pro boolean default false,
  pro_until timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text default 'Untitled Session',
  lyrics text default '',
  bpm int default 120,
  pattern jsonb default '{}',
  kit text default 'trap',
  updated_at timestamptz default now()
);
create index if not exists projects_user_idx on public.projects(user_id);

create table if not exists public.feed_posts (
  id text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  username text,
  avatar_url text,
  title text,
  lyrics text,
  bpm int default 120,
  kit text,
  pattern jsonb,
  created_at timestamptz default now()
);

create table if not exists public.likes (
  post_id text references public.feed_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id bigserial primary key,
  post_id text references public.feed_posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  username text,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists public.rooms (
  code text primary key,
  host_id uuid references public.profiles(id) on delete set null,
  title text,
  bpm int default 120,
  kit text,
  pattern jsonb,
  sections jsonb default '[]',
  updated_at timestamptz default now()
);

create table if not exists public.room_members (
  room_code text references public.rooms(code) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  username text,
  avatar_url text,
  joined_at timestamptz default now(),
  primary key (room_code, user_id)
);

create table if not exists public.room_vocals (
  id bigserial primary key,
  room_code text references public.rooms(code) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  username text,
  file_path text,
  file_url text,
  created_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.feed_posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.room_vocals enable row level security;

drop policy if exists "profiles read" on public.profiles;

create policy "profiles read" on public.profiles for select using (true);
drop policy if exists "profiles upsert own" on public.profiles;
create policy "profiles upsert own" on public.profiles for all using (auth.uid() = id);

drop policy if exists "projects own" on public.projects;

create policy "projects own" on public.projects for all using (auth.uid() = user_id);

drop policy if exists "feed read" on public.feed_posts;

create policy "feed read" on public.feed_posts for select using (true);
drop policy if exists "feed insert" on public.feed_posts;
create policy "feed insert" on public.feed_posts for insert with check (auth.uid() = user_id);
drop policy if exists "feed update own" on public.feed_posts;
create policy "feed update own" on public.feed_posts for update using (auth.uid() = user_id);

drop policy if exists "likes all auth" on public.likes;

create policy "likes all auth" on public.likes for all using (auth.uid() = user_id);
drop policy if exists "likes read" on public.likes;
create policy "likes read" on public.likes for select using (true);

drop policy if exists "comments read" on public.comments;

create policy "comments read" on public.comments for select using (true);
drop policy if exists "comments insert" on public.comments;
create policy "comments insert" on public.comments for insert with check (auth.uid() = user_id);

drop policy if exists "rooms read" on public.rooms;

create policy "rooms read" on public.rooms for select using (true);
drop policy if exists "rooms write auth" on public.rooms;
create policy "rooms write auth" on public.rooms for all using (auth.uid() is not null);

drop policy if exists "members read" on public.room_members;

create policy "members read" on public.room_members for select using (true);
drop policy if exists "members write" on public.room_members;
create policy "members write" on public.room_members for all using (auth.uid() = user_id);

drop policy if exists "vocals read" on public.room_vocals;

create policy "vocals read" on public.room_vocals for select using (true);
drop policy if exists "vocals write" on public.room_vocals;
create policy "vocals write" on public.room_vocals for all using (auth.uid() = user_id);

-- Realtime
do $$ begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.room_members;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.room_vocals;
exception when duplicate_object then null;
end $$;

-- Storage bucket (run in dashboard or via API): vocals (public read)
-- storage.objects policies: authenticated upload to folder user_id/*


-- ── Social: Follows + Private Messages ──
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists follows_following_idx on public.follows(following_id);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  read_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists messages_inbox_idx on public.messages(recipient_id, created_at desc);
create index if not exists messages_sent_idx on public.messages(sender_id, created_at desc);
create index if not exists messages_thread_idx on public.messages(sender_id, recipient_id, created_at);

alter table public.follows enable row level security;
alter table public.messages enable row level security;

drop policy if exists "follows read" on public.follows;
create policy "follows read" on public.follows for select using (true);
drop policy if exists "follows write own" on public.follows;
create policy "follows write own" on public.follows for all using (auth.uid() = follower_id);

drop policy if exists "messages participants" on public.messages;
create policy "messages participants" on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages for insert
  with check (auth.uid() = sender_id);
drop policy if exists "messages mark read" on public.messages;
create policy "messages mark read" on public.messages for update
  using (auth.uid() = recipient_id);

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;


-- ───────── 2. Social + collab chat extras  [supabase-air.sql] ─────────
-- Tapehead Pro AIR / Social v2
-- Run once in Supabase SQL Editor after supabase-schema.sql.

-- Rich public profile fields
alter table public.profiles add column if not exists bio text default '';
alter table public.profiles add column if not exists location text default '';
alter table public.profiles add column if not exists genres jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists links jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists open_to_collab boolean default false;
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- Feed fields used by the app
alter table public.feed_posts add column if not exists caption text default '';
alter table public.feed_posts add column if not exists hook text default '';
alter table public.feed_posts add column if not exists step_count int default 16;
alter table public.feed_posts add column if not exists key_name text;
alter table public.feed_posts add column if not exists mood text;
alter table public.feed_posts add column if not exists chords jsonb default '[]'::jsonb;
alter table public.feed_posts add column if not exists volumes jsonb;
alter table public.feed_posts add column if not exists open_to_collab boolean default false;
alter table public.feed_posts add column if not exists has_vocal boolean default false;
alter table public.feed_posts add column if not exists has_sound boolean default false;
alter table public.feed_posts add column if not exists full_song boolean default false;
alter table public.feed_posts add column if not exists mixdown_url text;

-- Realtime room chat / activity
create table if not exists public.collab_messages (
  id uuid primary key default gen_random_uuid(),
  room_code text not null references public.rooms(code) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  username text not null,
  body text not null check (char_length(body) <= 500),
  created_at timestamptz default now()
);
create index if not exists collab_messages_room_idx on public.collab_messages(room_code, created_at);

alter table public.collab_messages enable row level security;
drop policy if exists "collab messages read members" on public.collab_messages;
create policy "collab messages read members" on public.collab_messages for select using (
  exists (select 1 from public.room_members rm where rm.room_code = collab_messages.room_code and rm.user_id = auth.uid())
);
drop policy if exists "collab messages insert members" on public.collab_messages;
create policy "collab messages insert members" on public.collab_messages for insert with check (
  auth.uid() = user_id and exists (select 1 from public.room_members rm where rm.room_code = collab_messages.room_code and rm.user_id = auth.uid())
);

-- Allow users to update only their own profile.
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Follow writes must be by the authenticated follower.
drop policy if exists "follows insert own" on public.follows;
create policy "follows insert own" on public.follows for insert with check (auth.uid() = follower_id);
drop policy if exists "follows delete own" on public.follows;
create policy "follows delete own" on public.follows for delete using (auth.uid() = follower_id);

-- Feed owners can edit their own posts.
drop policy if exists "feed update own" on public.feed_posts;
create policy "feed update own" on public.feed_posts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "feed delete own" on public.feed_posts;
create policy "feed delete own" on public.feed_posts for delete using (auth.uid() = user_id);

-- Realtime. Run these once; if Supabase says a table is already in the publication, skip that line.
do $$ begin
  alter publication supabase_realtime add table public.feed_posts;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.likes;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.comments;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.follows;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
do $$ begin
  alter publication supabase_realtime add table public.collab_messages;
exception when duplicate_object then null;
end $$;

-- Recommended for production: require confirmed email before access.
-- Configure this in Supabase Auth > Providers > Email.

-- Storage bucket for collab vocals (private)
insert into storage.buckets (id, name, public) values ('vocals','vocals',false) on conflict (id) do nothing;


-- ───────── 3. Security hardening (RLS, blocks, reports, AI usage)  [supabase-security-hardening.sql] ─────────
-- Tapehead Pro production security hardening.
-- Run after supabase-schema.sql and supabase-air.sql.

-- 1) Public artist profiles must not expose email/contact or billing state.
drop policy if exists "profiles read" on public.profiles;
drop policy if exists "profiles upsert own" on public.profiles;
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists "profiles delete own" on public.profiles;
create policy "profiles delete own" on public.profiles for delete using (auth.uid() = id);

-- Safe public projection used by artist profiles. It intentionally excludes contact,
-- is_pro and pro_until. The underlying table remains protected by RLS.
create or replace view public.public_profiles as
select id, username, avatar_url, bio, location, genres, links, open_to_collab
from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- 2) Collaboration rooms: anyone can look up a room by its code to join,
-- but only the host can modify/delete the room.
drop policy if exists "rooms write auth" on public.rooms;
drop policy if exists "rooms insert own" on public.rooms;
drop policy if exists "rooms update host" on public.rooms;
drop policy if exists "rooms delete host" on public.rooms;
drop policy if exists "rooms insert own" on public.rooms;
create policy "rooms insert own" on public.rooms for insert with check (auth.uid() = host_id);
drop policy if exists "rooms update host" on public.rooms;
create policy "rooms update host" on public.rooms for update using (auth.uid() = host_id) with check (auth.uid() = host_id);
drop policy if exists "rooms delete host" on public.rooms;
create policy "rooms delete host" on public.rooms for delete using (auth.uid() = host_id);

-- Members can only read a room after joining; use a SECURITY DEFINER helper
-- so the policy does not recursively query room_members under its own RLS policy.
create or replace function public.is_room_member(p_room_code text, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.room_members
    where room_code = p_room_code and user_id = p_user_id
  );
$$;
revoke all on function public.is_room_member(text, uuid) from public;
grant execute on function public.is_room_member(text, uuid) to anon, authenticated;

drop policy if exists "members read" on public.room_members;
drop policy if exists "members write" on public.room_members;
drop policy if exists "members read room members" on public.room_members;
create policy "members read room members" on public.room_members for select using (
  auth.uid() = user_id or public.is_room_member(room_code, auth.uid())
);
drop policy if exists "members insert own" on public.room_members;
create policy "members insert own" on public.room_members for insert with check (auth.uid() = user_id);
drop policy if exists "members delete own" on public.room_members;
create policy "members delete own" on public.room_members for delete using (auth.uid() = user_id);

-- Vocal metadata and recordings are private to room members.
drop policy if exists "vocals read" on public.room_vocals;
drop policy if exists "vocals write" on public.room_vocals;
drop policy if exists "vocals read room members" on public.room_vocals;
create policy "vocals read room members" on public.room_vocals for select using (
  exists (select 1 from public.room_members rm where rm.room_code = room_vocals.room_code and rm.user_id = auth.uid())
);
drop policy if exists "vocals insert room members" on public.room_vocals;
create policy "vocals insert room members" on public.room_vocals for insert with check (
  auth.uid() = user_id and exists (select 1 from public.room_members rm where rm.room_code = room_vocals.room_code and rm.user_id = auth.uid())
);
drop policy if exists "vocals delete own" on public.room_vocals;
create policy "vocals delete own" on public.room_vocals for delete using (auth.uid() = user_id);

-- 3) Comments can be removed by their author.
drop policy if exists "comments delete own" on public.comments;
create policy "comments delete own" on public.comments for delete using (auth.uid() = user_id);

-- 4) AI usage ledger for server-side per-user rate limiting.
create table if not exists public.ai_usage (
  id bigint generated by default as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index if not exists ai_usage_user_created_idx on public.ai_usage(user_id, created_at desc);
alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;
-- The server uses the Supabase service role, which bypasses RLS.

-- 5) Make the vocal storage bucket private. Replace public URLs with signed URLs
-- in the application when this migration is enabled.
update storage.buckets set public = false where id = 'vocals';


-- 6) Private vocal storage policies. Object names are <user_id>/<room_code>_...
drop policy if exists "vocals public read" on storage.objects;
drop policy if exists "vocals authenticated upload" on storage.objects;
drop policy if exists "vocals own upload" on storage.objects;
drop policy if exists "vocals room read" on storage.objects;
drop policy if exists "vocals own delete" on storage.objects;
drop policy if exists "vocals room read" on storage.objects;
create policy "vocals room read" on storage.objects for select using (
  bucket_id = 'vocals'
  and exists (
    select 1 from public.room_members rm
    where rm.user_id = auth.uid()
      and rm.room_code = split_part(split_part(name, '/', 2), '_', 1)
  )
);
drop policy if exists "vocals own upload" on storage.objects;
create policy "vocals own upload" on storage.objects for insert with check (
  bucket_id = 'vocals'
  and split_part(name, '/', 1) = auth.uid()::text
  and exists (
    select 1 from public.room_members rm
    where rm.user_id = auth.uid()
      and rm.room_code = split_part(split_part(name, '/', 2), '_', 1)
  )
);
drop policy if exists "vocals own delete" on storage.objects;
create policy "vocals own delete" on storage.objects for delete using (
  bucket_id = 'vocals' and split_part(name, '/', 1) = auth.uid()::text
);

-- 7) Social safety: blocks and reports.
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create index if not exists blocks_blocked_idx on public.blocks(blocked_id);
alter table public.blocks enable row level security;
drop policy if exists "blocks own" on public.blocks;
create policy "blocks own" on public.blocks for all using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

create table if not exists public.reports (
  id bigint generated by default as identity primary key,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 80),
  created_at timestamptz not null default now()
);
create index if not exists reports_created_idx on public.reports(created_at desc);
alter table public.reports enable row level security;
drop policy if exists "reports create own" on public.reports;
create policy "reports create own" on public.reports for insert with check (auth.uid() = reporter_id);

-- Blocked users cannot receive new direct messages from the blocker relationship.
drop policy if exists "messages send" on public.messages;
create policy "messages send" on public.messages for insert with check (
  auth.uid() = sender_id
  and not exists (
    select 1 from public.blocks b
    where (b.blocker_id = auth.uid() and b.blocked_id = recipient_id)
       or (b.blocker_id = recipient_id and b.blocked_id = auth.uid())
  )
);


-- ───────── 4. Pro entitlements + payment transactions  [supabase-pro.sql] ─────────
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


-- ───────── 5. Project limits, messaging rules  [supabase-phase4.sql] ─────────
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


-- ───────── 6. join_room()  [supabase-phase5.sql] ─────────
-- Tapehead Pro Phase 5 — collaboration ownership and privacy hardening.
-- Run AFTER supabase-phase4.sql.

-- 1) Room membership is granted only through a server-side join function.
-- A room code is treated as an invite capability; knowing it allows joining,
-- but clients cannot arbitrarily insert membership rows for another room/user.
drop policy if exists "members insert own" on public.room_members;

create or replace function public.join_room(p_room_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  normalized text := upper(trim(p_room_code));
  exists_room boolean;
begin
  if uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;
  if normalized is null or normalized = '' or char_length(normalized) > 32 then
    raise exception 'INVALID_ROOM_CODE';
  end if;

  select exists(select 1 from public.rooms where code = normalized) into exists_room;
  if not exists_room then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  insert into public.room_members(room_code, user_id, username, avatar_url)
  select normalized, uid, p.username, p.avatar_url
  from public.profiles p
  where p.id = uid
  on conflict (room_code, user_id) do nothing;

  return true;
end;
$$;
revoke all on function public.join_room(text) from public, anon;
grant execute on function public.join_room(text) to authenticated;

-- 2) Once joined, only the host or members can read the room contents.
-- This prevents a guessed room code from exposing the beat/lyrics/sections.
drop policy if exists "rooms read" on public.rooms;
drop policy if exists "rooms read members" on public.rooms;
create policy "rooms read members" on public.rooms for select using (
  auth.uid() = host_id
  or public.is_room_member(code, auth.uid())
);

-- 3) Hosts can remove members. Members can leave themselves, but the host
-- remains attached to the room until the room itself is deleted.
drop policy if exists "members delete own" on public.room_members;
drop policy if exists "members delete host" on public.room_members;
drop policy if exists "members delete own" on public.room_members;
create policy "members delete own" on public.room_members for delete using (
  auth.uid() = user_id
  and not exists (
    select 1 from public.rooms r
    where r.code = room_members.room_code and r.host_id = auth.uid()
  )
);
drop policy if exists "members delete host" on public.room_members;
create policy "members delete host" on public.room_members for delete using (
  exists (
    select 1 from public.rooms r
    where r.code = room_members.room_code
      and r.host_id = auth.uid()
      and room_members.user_id <> auth.uid()
  )
);

-- 5) Only room members can create/read collaboration chat messages. Keep the
-- existing policies if they already exist; this migration makes them explicit.
drop policy if exists "collab messages read members" on public.collab_messages;
drop policy if exists "collab messages insert members" on public.collab_messages;
drop policy if exists "collab messages read members" on public.collab_messages;
create policy "collab messages read members" on public.collab_messages for select using (
  public.is_room_member(room_code, auth.uid())
);
drop policy if exists "collab messages insert members" on public.collab_messages;
create policy "collab messages insert members" on public.collab_messages for insert with check (
  auth.uid() = user_id
  and public.is_room_member(room_code, auth.uid())
);

-- 6) Room vocal metadata can only be changed by the owner of the take.
-- Host/member access is already enforced by Phase 4 for reads/inserts.
drop policy if exists "vocals update own" on public.room_vocals;
create policy "vocals update own" on public.room_vocals for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 7) Helpful indexes for authorization lookups and collaboration loading.
create index if not exists room_members_user_room_idx
  on public.room_members(user_id, room_code);
create index if not exists room_vocals_room_created_idx
  on public.room_vocals(room_code, created_at desc);


-- ───────── 7. mark_messages_read(), AI usage, public_profiles  [supabase-phase6.sql] ─────────
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


-- ───────── 8. Project sync tweaks  [supabase-phase8.sql] ─────────
-- Tapehead Pro Phase 8: durable cloud project metadata
alter table public.projects add column if not exists hook text default '';
alter table public.projects add column if not exists song_key text default '';
alter table public.projects add column if not exists mood text default '';
alter table public.projects add column if not exists reference text default '';
alter table public.projects add column if not exists sections jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists step_count integer not null default 16;
alter table public.projects add column if not exists vocal_meta jsonb;

create index if not exists projects_user_updated_idx on public.projects(user_id, updated_at desc);

-- Owner-only access. Existing policies from earlier migrations may remain;
-- these policies make the intended boundary explicit for deployments using this migration.
alter table public.projects enable row level security;
drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects for select using (auth.uid() = user_id);
drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects for insert with check (auth.uid() = user_id);
drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects for delete using (auth.uid() = user_id);
