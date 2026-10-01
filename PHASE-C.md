# Tapehead Pro — Phase C (Collab at scale)

## What you get
- Cloud auth (email + password via Supabase)
- Projects sync (when wired to your account)
- Realtime collab rooms (sections, members, beat)
- Vocal files in Storage (not localStorage)
- Local fallback if cloud is disabled

## Setup (about 15 minutes)

1. Create a free project: https://supabase.com
2. **SQL Editor** → paste and run `supabase-schema.sql`
3. **Storage** → create bucket `vocals` → set public read (or signed URLs)
4. **Settings → API** → copy Project URL + `anon` key
5. Edit `cloud-config.js`:

```js
window.TAPEHEAD_CLOUD = {
  enabled: true,
  supabaseUrl: 'https://YOUR_PROJECT.supabase.co',
  supabaseAnonKey: 'YOUR_ANON_KEY'
};
```

6. Deploy all files in `www/` (including `cloud-config.js`)
7. Open the app → sidebar should say **Cloud · Phase C**

## Auth note
Cloud sign-up uses **email** through Supabase Auth.  
Local email/phone accounts still work when `enabled: false`.

Phone OTP needs a Supabase phone provider (Twilio, etc.) — enable later in Supabase Auth settings.

## Collab across phones
1. Both users: same deployed app with cloud enabled
2. Both signed in (cloud)
3. Host creates room → share code
4. Guest joins code → live updates via Realtime

## Cost
Free Supabase tier is enough for early growth (well past hobby traffic).  
Upgrade when storage/bandwidth for vocals grows.

## Security
Never put the **service_role** key in the frontend.  
Only the **anon** key belongs in `cloud-config.js`.
