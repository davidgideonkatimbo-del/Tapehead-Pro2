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
alter publication supabase_realtime add table public.feed_posts;
alter publication supabase_realtime add table public.likes;
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.follows;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.collab_messages;

-- Recommended for production: require confirmed email before access.
-- Configure this in Supabase Auth > Providers > Email.
