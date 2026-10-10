# Tapehead Pro v1.11.4 — Project Persistence & Recovery Integration

## Included
- Adds `www/project-persistence.js` as a shared boundary for validating, parsing, serializing, snapshotting and merging project records.
- Local project load/save and cloud hydration use the shared module.
- Cloud persistence writes the complete song object to `projects.project_data` when that column exists, and reads it back while preserving the database identity and timestamp.
- Legacy Supabase schemas fall back to the existing columns if `project_data` is missing, so project saves continue to work while the migration is pending.
- Adds `www/supabase-phase9-project-recovery.sql` for complete snapshots and owner-only rolling version history (up to 20 versions per project).
- Standardizes package, app and service-worker version identifiers to 1.11.4.

## Important deployment step
Before expecting full cross-device project snapshots/version history, run `www/supabase-phase9-project-recovery.sql` in the Supabase SQL Editor. The application has a legacy-column fallback, but without the migration, full snapshots and version history are not active. Review this migration against the live database before applying.

## AI jobs compatibility
The v1.11 jobs API is retained and now has a compatible `www/ai-job-client.js` transport. Write AI accepts both synchronous `/api/ai` text responses and queued responses, polls `/api/jobs?id=...`, and returns the job result to the existing UI. This does not add a scheduler: if `AI_ASYNC_FULL_SONG=1`, the deployment must have a configured, secured job processor or queued full-song requests can remain queued.

## Verification scope
Local tests cover persistence normalization/merge behavior and app/cloud integration. Live Supabase migrations, cross-device recovery and Vercel job processing must still be verified in deployment.
