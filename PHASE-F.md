# Tapehead Pro Phase F — End-to-End Launch Hardening

This pass focuses on issues found by tracing the full signup → social → collaboration → AI → Pro lifecycle.

## Changes
- Cloud deployments no longer silently fall back to browser-local plaintext-password authentication when the configured cloud service is unavailable.
- Password minimum for new accounts is 8 characters.
- Direct-message read state now uses a narrow `mark_messages_read` RPC; clients no longer receive generic UPDATE permission on messages.
- AI usage enforcement now uses an atomic server-side RPC with an advisory lock, preventing concurrent requests from racing through the hourly quota.
- New collaboration invite codes are 8 characters instead of 4.
- Cloud room creation is awaited before the UI treats the room as created.
- Sending a lyrics section to a newly created room now waits for room creation.
- Vocal uploads reject unsupported audio types and files over 25 MB before upload.
- Public artist profiles continue to use a restricted projection with no contact/billing fields.

## Supabase migration
Run `www/supabase-phase6.sql` after the earlier Tapehead migrations.

## Deployment
Keep `TAPEHEAD_CLOUD.enabled` set to `true` in production. Do not add browser-visible service-role keys. The Supabase anon key is safe to expose subject to correct RLS policies; service-role and payment/AI secrets must remain server-side in Vercel environment variables.
