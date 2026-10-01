# Tapehead Pro — Production Security Posture

## Controls in place

- Public artist profile lookups expose only intentional public fields (not contact, internal Pro flags, or private identifiers beyond what the product shows).
- `supabase-security-hardening.sql` tightens profile, collaboration-room, room-member, vocal metadata, comment, storage, and AI-usage policies.
- Collaboration vocals use signed URLs rather than permanent public object URLs.
- Server-side AI usage ledger with a 30 requests per user per hour limit and atomic consumption under a per-user lock.
- `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, and Pesapal credentials remain server-only.
- Password signup validation is consistent with the product rules.
- Cloud password-reset flow is available in the sign-in UI.
- Authenticated account deletion via `/api/delete-account` with vocal storage cleanup and auth user removal.
- Block and report controls on public profiles.
- Cloud authentication is the production path; local plaintext credential storage is not used for production accounts (`allowLocalFallback: false` in cloud config).
- Message read state uses a narrow RPC; unrestricted client updates to messages are revoked.
- Collaboration room invite codes use an 8-character format for new rooms.
- Vocal uploads enforce client-side MIME/type and 25MB size checks before upload.
- Pro checkout and verification run on the server; AI requires an active `pro_entitlements` record.

## Operational practices

- Enable Supabase email confirmation and configure redirect URLs for production.
- Monitor Pesapal IPN calls and failed verification events.
- Review block/report signals and remove abusive content under the Terms of Service.
- Rotate service-role and payment secrets if exposure is suspected.
- Keep Privacy Policy and Terms of Service current when processors or data practices change.

## Support

Security and privacy requests: support@tapehead.pro
