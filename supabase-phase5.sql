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
create policy "members delete own" on public.room_members for delete using (
  auth.uid() = user_id
  and not exists (
    select 1 from public.rooms r
    where r.code = room_members.room_code and r.host_id = auth.uid()
  )
);
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
create policy "collab messages read members" on public.collab_messages for select using (
  public.is_room_member(room_code, auth.uid())
);
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
