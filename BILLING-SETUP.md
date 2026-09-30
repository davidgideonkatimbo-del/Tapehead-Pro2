# Tapehead Pro — Production Billing (Pesapal)

Pesapal API 3.0 hosted checkout (card + mobile money). The browser never receives your Pesapal keys.

## 1. Supabase

Run these SQL files in order (with the rest of your production migrations):

1. `www/supabase-schema.sql`
2. `www/supabase-security-hardening.sql`
3. `www/supabase-pro.sql`

No schema change is needed for Pesapal.

## 2. Pesapal account

- Sandbox: get test credentials from https://developer.pesapal.com/api3-demo-keys.txt
- Live: open a business account at https://www.pesapal.com/dashboard/account/register. Your live
  `consumer_key` and `consumer_secret` are emailed to you.
- **USD must be enabled on your Pesapal merchant account.** Tapehead always charges in USD. In the Pesapal dashboard (or with Pesapal support) confirm USD collection is active for your account, and check which payment methods it offers for USD (mobile money is usually tied to local currencies).

## 3. Vercel environment variables

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_KEY
OPENAI_MODEL=gpt-5.6-sol
PESAPAL_CONSUMER_KEY=YOUR_KEY
PESAPAL_CONSUMER_SECRET=YOUR_SECRET
PESAPAL_ENV=sandbox
# Optional USD price overrides (defaults: 4.99 / 29 / 49)
# PRO_MONTHLY_PRICE=4.99
PUBLIC_APP_URL=https://YOUR-DOMAIN
```

`PESAPAL_ENV` defaults to `sandbox`. Set it to `live` only together with your live keys.
Redeploy after changing any variable.

Never place `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `PESAPAL_CONSUMER_KEY` or `PESAPAL_CONSUMER_SECRET`
in `cloud-config.js` or other frontend files.

## 4. IPN (payment notifications)

Pesapal needs a registered IPN URL for every order. The app does this automatically: on the first checkout it looks
for `https://YOUR-DOMAIN/api/pesapal-ipn` in your Pesapal IPN list and registers it if missing.

To register it yourself instead, call `URLSetup/RegisterIPN` once with that URL and type `GET`, then set the returned
`ipn_id` as `PESAPAL_IPN_ID`. Sandbox and live have separate IPN ids.

## 5. Payment flow

1. Signed-in user chooses a plan; the app shows the price from `/api/pro-plans`.
2. `/api/pro-checkout` stores a pending transaction and creates a Pesapal order (`SubmitOrderRequest`).
3. User pays on Pesapal (card or mobile money).
4. Pesapal redirects back to `/?payment=complete&OrderTrackingId=...&OrderMerchantReference=...`.
5. `/api/pro-verify` asks Pesapal for the real status (`GetTransactionStatus`) and checks reference, tracking id,
   amount and currency before granting Pro.
6. Pesapal also calls `/api/pesapal-ipn`. Neither the redirect nor the IPN carries a payment status, so the server
   always re-checks with Pesapal. A transaction is claimed atomically, so Pro is granted only once.
7. A reversed payment revokes the Pro period it paid for.
8. `pro_entitlements` is the authoritative Pro record used by the AI route and status endpoints.

## 6. Currency

Everything is charged in **USD**. The currency is fixed in code (`api/_pro.js`), not read from the environment.
Default prices are $4.99 monthly, $29 yearly and $49 lifetime. `PRO_MONTHLY_PRICE`, `PRO_YEARLY_PRICE` and
`PRO_LIFETIME_PRICE` are optional overrides; the app always displays what the server will charge.

## 7. Verification checklist

Test in sandbox first, then repeat once with a small live payment:

- Successful payment (Pro activates, only one period added)
- Failed payment
- Cancelled checkout
- Closing the tab before returning (IPN should still activate Pro)
- Refresh after successful payment
- Amount / currency mismatch (must not grant Pro)
- Purchase while already on Pro (period extends) and on lifetime

## Support

Billing questions: support@tapehead.pro
