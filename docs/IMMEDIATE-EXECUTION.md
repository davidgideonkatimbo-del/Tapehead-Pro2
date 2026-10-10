# Immediate Execution Plan (B)

Work directly on the current v1.10.56 zip. Keep the product shipping at every step.

## Step 1 — Module map & safe extraction points (this document + ARCHITECTURE-TARGET.md)

Already completed in `docs/ARCHITECTURE-TARGET.md`.

## Step 2 — First modular extraction (safe)

Create `www/js/` and extract **without changing behavior**:

1. `www/js/cloud.js`          ← current Cloud object (lines ~2–1076)
2. `www/js/state.js`           ← state + scheduleSave + persistence helpers
3. `www/js/audio-core.js`      ← ensureAudio, live graph, drum voices, playNote
4. Keep `app.js` as orchestrator that imports/loads these and still exposes the same `window.*` bridges.

Use simple script tags or a tiny loader so Vercel static hosting stays simple. No bundler required for the first pass.

## Step 3 — Pro + AI hardening (quick defensibility win)

In `www/api/ai.js` and `www/api/_pro.js`:

- Re-validate Pro entitlement on every AI request (already partially done — make strict).
- Make rate limit plan-aware and recorded against `user_id`.
- Reject guest tokens cleanly.
- Log usage server-side for later metering UI.

## Step 4 — Minimal durable jobs

1. Add `supabase/tapehead-jobs.sql` (see file).
2. Add `www/api/_jobs.js` helpers: createJob, claimJob, completeJob, failJob.
3. Wire `/api/ai` to create a job when the request is long-running; return `jobId` so the client can poll.
4. Client keeps current UX; polling is additive.

## Step 5 — Expand tests

Add to `tests/`:

- `ai-route.test.mjs` — auth, Pro, rate-limit contracts (static analysis + pure helpers)
- `pro-entitlement.test.mjs`
- `jobs-schema.test.mjs` — SQL and helper presence

## Definition of done for this first wave

- [ ] Architecture docs committed
- [ ] At least Cloud + State extracted into separate files without breaking the app
- [ ] Jobs table SQL ready to run
- [ ] AI route always checks entitlement + rate limit server-side
- [ ] New tests passing
