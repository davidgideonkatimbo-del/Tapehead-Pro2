-- Run this in Supabase SQL Editor if you already applied the base schema


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

alter publication supabase_realtime add table public.messages;
