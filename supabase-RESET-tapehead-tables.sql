-- ============================================================================
-- Tapehead Pro — RESET (DESTRUCTIVE)
-- Deletes ALL Tapehead tables and their data (projects, feed posts, messages, rooms, Pro records).
-- It does NOT touch Supabase Auth users. Use ONLY if this Supabase project holds no data you need
-- (e.g. a brand-new project polluted by failed setup attempts).
-- Afterwards run supabase-ALL-IN-ONE.sql.
-- ============================================================================
drop view if exists public.public_profiles cascade;
drop table if exists public.likes cascade;
drop table if exists public.comments cascade;
drop table if exists public.feed_posts cascade;
drop table if exists public.room_vocals cascade;
drop table if exists public.room_members cascade;
drop table if exists public.collab_messages cascade;
drop table if exists public.rooms cascade;
drop table if exists public.messages cascade;
drop table if exists public.follows cascade;
drop table if exists public.blocks cascade;
drop table if exists public.reports cascade;
drop table if exists public.ai_usage cascade;
drop table if exists public.projects cascade;
drop table if exists public.pro_transactions cascade;
drop table if exists public.pro_entitlements cascade;
drop table if exists public.profiles cascade;
