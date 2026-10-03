# Tapehead Pro

**Live:** [https://tapehead-pro2.vercel.app](https://tapehead-pro2.vercel.app)

Mobile music studio — write lyrics, make beats, record vocals, mix, collab, and share. Built for artists in Uganda, Nigeria, Kenya, South Africa, and across Africa.

**Founder:** David Gideon Katimbo (Deon)

**Legal:** [Privacy Policy](https://tapehead-pro2.vercel.app/privacy.html) · [Terms of Service](https://tapehead-pro2.vercel.app/terms.html)


## v1.10.0 — Guest exploration

Core studio (Write, Beat, Keys, Record, Mix) is fully usable as a guest. Sign-in is only required for cloud save, Feed publish, Collab, messaging, and Cloud AI. Tap **Explore as guest** on first launch.

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
**Easiest:** run `www/supabase-ALL-IN-ONE.sql` once in the Supabase SQL Editor (all migrations, correct order, re-runnable). The individual files below are kept for reference; if you run them yourself, use exactly this order:

1. `www/supabase-schema.sql` (already includes follows/messages, so `supabase-social.sql` is not needed)
2. `www/supabase-air.sql`
3. `www/supabase-security-hardening.sql`
4. `www/supabase-pro.sql`
5. `www/supabase-phase4.sql`, `supabase-phase5.sql`, `supabase-phase6.sql`, `supabase-phase8.sql` (in that order)

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
