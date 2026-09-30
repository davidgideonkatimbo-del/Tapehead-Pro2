# Tapehead Pro Phase G — Product Quality

## Improvements
- Password signup/recovery copy now consistently requires 8+ characters.
- Added a working Supabase password-recovery completion flow.
- Feed publishing now waits for cloud persistence and reports failures instead of claiming success.
- Local feed entries no longer retain the user's private contact field.
- Service-worker cache version bumped so the Phase G UI is picked up after deployment.

## Validation
- All inline JavaScript blocks pass `node --check`.
- No new database migration is required for this phase.
