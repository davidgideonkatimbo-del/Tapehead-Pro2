# Tapehead Pro Phase D — Production safeguards

## Included
- Server-side 3-project free-tier enforcement with race protection.
- Server-side direct-message anti-spam limit (30 messages/hour/user).
- Blocks prevent new DMs, follows, and comments between blocked accounts.
- Self-reporting is rejected at the database layer.
- Cloud Pro status is restored from server entitlements, not a browser-only cache.
- Privacy Policy discloses that AI writing requests are sent to the configured AI service provider.

## Database
Run `www/supabase-phase4.sql` after the existing schema, security, and pro migrations.

## Authentication
Production accounts use Supabase Auth (email/password). Cloud configuration disables local credential fallback (`allowLocalFallback: false`).
