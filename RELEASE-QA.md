# Tapehead Pro v1.8.4 — Release QA

## Verified statically
- Seven primary destinations are present in the bottom bar: Write, Beat, Record, Feed, Collab, Keys, Mix.
- No duplicate HTML element IDs.
- All inline JavaScript blocks pass Node syntax validation.
- All Vercel API JavaScript files pass Node syntax validation.
- Publish modal Cancel action targets the actual `closePublishBtn` element.
- Publish preview writes to the `<pre>` element with `textContent` instead of the unsupported `value` property.
- Service-worker cache version is bumped for this release.
- App/package version is 1.8.4.
- Supabase tables referenced by the frontend are represented in the supplied SQL set, including profiles, projects, social tables, collaboration tables, blocks and reports.

## Browser-dependent checks to perform after deployment
1. Sign up / sign in and sign out.
2. Open each of the seven bottom tabs and confirm the page title and active tab change.
3. Create, edit, reload and switch projects.
4. Test Write AI only after Vercel environment variables are configured.
5. Test microphone recording on HTTPS/mobile permission flow.
6. Test Feed publish, likes, comments, follow and messaging with two accounts.
7. Test Collab room creation/join and vocal upload with two accounts.
8. Test Pro checkout/trial only with real configured payment credentials.
9. Install/update the PWA and confirm the new service-worker cache replaces the previous build.

## v1.9.3 automated checks (run before every deploy)

```
node tests/pesapal-flow.test.mjs   # checkout, verify, IPN, USD, double-grant, reversal
node tests/hum-engine.test.mjs     # pitch detection + key/chord suggestion
```

Push all changes in ONE commit: on Vercel Hobby every commit is a deployment and there is a daily deployment cap.
