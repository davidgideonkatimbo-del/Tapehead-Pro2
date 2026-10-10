-- Optional: store collab room continuity locks (safe to re-run)
alter table if exists public.rooms add column if not exists continuity jsonb;
