# Tapehead Pro

**Live:** [https://tapehead-pro2.vercel.app](https://tapehead-pro2.vercel.app)

Mobile music studio — write lyrics, make beats, record vocals, mix, collab, and share. Built for artists in Uganda, Nigeria, Kenya, South Africa, and across Africa.

**Founder:** David Gideon Katimbo (Deon)

**Legal:** [Privacy Policy](./privacy.html) · [Terms of Service](./terms.html)

## Deploy

### Vercel
Connect this repo to Vercel. Root directory = folder that contains `index.html` (this `www/` folder or repo root as configured).

### Required files
- `index.html`
- `sw.js`
- `cloud-config.js`
- `manifest.webmanifest` + icons
- `og-image.jpg` (1200×630)
- `robots.txt`, `sitemap.xml`
- `privacy.html`, `terms.html`

### Supabase
Run SQL in the Supabase SQL Editor in order, starting with `supabase-schema.sql`, then social/air, security hardening, phase scripts, and `supabase-pro.sql`. Cloud keys for the browser live in `cloud-config.js` (anon key only).

## SEO
Canonical and Open Graph point to `https://tapehead-pro2.vercel.app`.

## Production Pro billing

Pro billing is server-authoritative. Do **not** put Pesapal keys in `cloud-config.js` or frontend code.

Run these SQL files in Supabase (in order with your full migration set):

1. `supabase-schema.sql`
2. `supabase-security-hardening.sql`
3. `supabase-pro.sql`

**Vercel server environment variables:**

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server only
- `OPENAI_API_KEY` — server only
- `OPENAI_MODEL` (optional)
- `PESAPAL_CONSUMER_KEY` — server only
- `PESAPAL_CONSUMER_SECRET` — server only
- `PESAPAL_ENV` — `sandbox` (default) or `live`
- `PESAPAL_IPN_ID` — optional; otherwise registered automatically
- Prices are always in USD (defaults 4.99 / 29 / 49). Optional overrides: `PRO_MONTHLY_PRICE`, `PRO_YEARLY_PRICE`, `PRO_LIFETIME_PRICE`
- `PUBLIC_APP_URL` — production URL

Pesapal IPN URL (registered automatically on first checkout):

`https://YOUR-DOMAIN/api/pesapal-ipn`

Payments are created on the server, verified against transaction reference, amount, currency, and successful status before Pro is granted. The frontend never receives the Pesapal keys.

Cloud AI and other paid backend features enforce Pro through `pro_entitlements` on the server.

## Support

**Email:** support@tapehead.pro
