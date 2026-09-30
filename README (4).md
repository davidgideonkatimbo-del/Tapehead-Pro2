# Tapehead Pro

**Live:** [https://tapehead-pro.vercel.app](https://tapehead-pro.vercel.app)

Mobile music studio — write lyrics, make beats, record vocals, mix, collab, and share. Built for artists in Uganda, Nigeria, Kenya, South Africa, and across Africa.

**Founder:** David Gideon Katimbo (Deon)

**Legal:** [Privacy Policy](https://tapehead-pro.vercel.app/privacy.html) · [Terms of Service](https://tapehead-pro.vercel.app/terms.html)

## Deploy

### Vercel
Connect this repo to Vercel. Set the root directory to the folder that contains `index.html` (typically `www/`).

### Required web assets
- `index.html`
- `sw.js`
- `cloud-config.js`
- `manifest.webmanifest` and icons
- `og-image.jpg` (1200×630)
- `robots.txt`, `sitemap.xml`
- `privacy.html`, `terms.html`

### Supabase
Run the SQL files in the Supabase SQL Editor in this order:

1. `www/supabase-schema.sql`
2. `www/supabase-social.sql` / `www/supabase-air.sql` (as needed for social features)
3. `www/supabase-security-hardening.sql`
4. Phase scripts (`supabase-phase4.sql` … `supabase-phase8.sql`) as applicable
5. `www/supabase-pro.sql`

Use the Supabase **anon** key only in frontend config. Keep the **service role** key server-only.

## Cloud AI (Write page)

Server route: `/api/ai`. The browser never receives the OpenAI API key.

**Vercel environment variables:**

- `OPENAI_API_KEY` — server only
- `OPENAI_MODEL` — optional (default configured in `.env.example`)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server only

Cloud AI actions: Finish Verse, Write Next, Polish, Hook Lab, Create Full Song. AI is limited to 30 requests per user per hour and requires an active Pro entitlement (including trial). When Cloud AI is unavailable, supported local songwriting fallbacks remain available.

Never place `OPENAI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` in `cloud-config.js`, `index.html`, or any client-exposed file.

## Social (AIR)

Cloud accounts, Feed, follow/unfollow, private messaging, and realtime Collab chat run through Supabase. See `AIR-SOCIAL-SETUP.md`.

## Pro billing

Pro billing is server-authoritative via Pesapal. See `BILLING-SETUP.md`.

Paid access is granted only after server verification of the transaction (checkout + verify + webhook). AI and entitlement checks use `pro_entitlements` on the server.

## Security

Production hardening is documented in `SECURITY-AUDIT.md` and applied via `supabase-security-hardening.sql` and the serverless API routes. Account deletion is available through `/api/delete-account`.

## Support

**Email:** support@tapehead.pro
