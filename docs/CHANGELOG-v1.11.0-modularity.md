# Tapehead v1.11.0 — Modularity foundation (maturity series)

## What changed

### Extracted modules
- `www/js/state.js` — shared state, `$`, `on`, `makeStableId`, `scheduleSave`
- `www/js/cloud.js` — full Supabase Cloud layer (`window.TapeheadCloud`)

### app.js
- Reduced from ~7736 lines to ~7311 lines
- Uses external modules when present; keeps safe fallbacks if scripts fail to load
- Window bridges extended: `saveSession`, `updateUserUI`, `lockApp`, `updateCloudBadge`

### index.html
- Loads `js/state.js` → `js/cloud.js` → `app.js` (cache-busted `?v=1.11.0-mod`)

### Also in this maturity wave (docs + schema)
- `docs/ARCHITECTURE-TARGET.md` — target architecture
- `docs/TOP5-UPGRADES.md` — prioritized upgrades
- `docs/IMMEDIATE-EXECUTION.md` — execution plan
- `www/supabase-jobs.sql` — durable jobs table + secure claim function

## Why this matters
First real step toward a hard-to-copy codebase: domain boundaries, smaller surface for reverse-engineering, and a clear path to durable jobs + server-side metering.

## Deploy notes
1. Deploy `www/` including the new `js/` folder.
2. Hard-refresh or unregister service worker so `1.11.0-mod` assets load.
3. Optional: run `supabase-jobs.sql` when ready for Phase 2 jobs.

## Next
1. Harden `/api/ai` entitlement + rate limits (Upgrade #3)
2. Wire AI long requests through jobs (Upgrade #2)
3. Expand behavioral tests (Upgrade #4)

## v1.11.0 — AI / Pro hardening (Upgrade #3)

### Server
- `www/api/ai.js` rewritten to use shared `_pro.js` helpers (`getBearerUser`, `getEntitlement`)
- Plan-aware hourly limits: trial 20 · month 45 · year/lifetime 60
- IP rate limit (40/min per instance) via `www/api/security.js`
- **Usage recorded only after successful OpenAI response** (failed upstream no longer burns quota)
- Input cleaning + strict action allowlist retained

### SQL
- `www/supabase-ai-usage-v2.sql` — `check_ai_usage` + `record_ai_usage` (service_role only)
- Legacy `consume_ai_usage` fixed to allow service_role (auth.uid() null)

### Tests
- `tests/ai-security.test.mjs` — limits, allowlist, rate limit, record-after-success contract

### Deploy
1. Deploy API routes (`ai.js`, `security.js`, `_pro.js`)
2. Run `supabase-ai-usage-v2.sql` in Supabase SQL editor
3. No client change required

## v1.11.0 — Durable jobs (Upgrade #2)

### New
- `www/api/_jobs.js` — create / claim / complete / fail / cancel helpers
- `www/api/jobs.js` — REST API:
  - `POST /api/jobs` — create `{ kind, payload }` (Pro required for `ai_generate`)
  - `GET /api/jobs?id=` — status (scoped to owner)
  - `DELETE /api/jobs?id=` — cancel
  - `POST /api/jobs?op=process` — claim + run one `ai_generate` (secret: `JOBS_PROCESS_SECRET` or `CRON_SECRET`)
- `www/supabase-jobs.sql` — table + `claim_tapehead_job` (service_role only, stale recovery 15 min)

### AI integration
- `full_song` can run async when `AI_ASYNC_FULL_SONG=1` or `body.async=true` → returns **202** + `job.id`
- Client can poll `GET /api/jobs?id=`

### Priorities
| kind | priority |
|------|----------|
| ai_generate | 5 |
| bounce | 8 |
| stem_render | 9 |
| export | 10 |

### Deploy
1. Run `www/supabase-jobs.sql` in Supabase
2. Deploy new API routes
3. Optional env: `JOBS_PROCESS_SECRET`, `AI_ASYNC_FULL_SONG=1`
4. Optional cron: `POST /api/jobs?op=process` with Bearer secret every minute

## v1.11.0 — Tests + Musical Continuity (Upgrades #4 & #5 foundation)

### Behavioral tests (32 passing)
- `tests/money-paths.test.mjs` — free limit, requirePro, guest, per-user song keys, no secrets in client, server entitlement checks
- `tests/continuity.test.mjs` — snapshot locks, section form suggestions
- Existing: modularity, AI security, jobs, write-premium, hum-engine, pesapal

### Musical continuity foundation
- `www/js/continuity.js` → `window.TapeheadContinuity`
  - `snapshot(state)` — bpm/key/style/language + section order
  - `applyLocks(options, snap)` — keep AI on-brief
  - `suggestNextSection(snap)` — form-aware next section
- Loaded from `index.html` before `app.js`
- `runAi` applies continuity locks when the module is present

### Maturity series status
| # | Upgrade | Status |
|---|---------|--------|
| 1 | Modularize app.js | Done |
| 2 | Durable jobs | Done |
| 3 | Server Pro + AI metering | Done |
| 4 | Behavioral tests | Done (32 tests) |
| 5 | Musical continuity | Foundation shipped |

### Deploy extras
1. Include `www/js/continuity.js` in deploy
2. No new SQL for continuity
3. Full SQL still needed: `supabase-jobs.sql` + `supabase-ai-usage-v2.sql`

## v1.11.1 — Deep musical continuity

### Continuity v2 (`www/js/continuity.js`)
- **snapshot** — section order, openers, soft rhyme anchors, hook, locks
- **attachToSong / restoreFromSong** — continuity blob travels with every project (local + cloud via existing `saveProjects`)
- **buildBrief** — short system brief injected into AI options as `continuityBrief`
- **driftReport** — helper for future UI warnings

### Wiring
- `saveCurrentSong` → attaches `song.continuity` before persist
- `loadSong` → restores locks into state (`state._continuity`)
- `runAi` → applyLocks + buildBrief on every Cloud AI call
- Server `ai.js` → folds `continuityBrief` into system instructions

### Tests
- 35 passing (round-trip attach/restore, brief contents, app+server contracts)

### Why this is a moat
Competitors cloning the UI still lack:
1. Persisted per-project musical locks
2. Server-enforced brief continuity
3. Section-aware rhyme/hook constraints that survive reload and cloud sync

## v1.11.2 — Continuity UI, jobs, collab

### UI
- `continuityBadge` in AI Lyrics Studio header — e.g. `Locked · Am · 118 BPM · amapiano`
- `pcContinuity` in project context bar
- `updateContinuityBadge()` on save, load, AI, project context refresh

### Jobs
- Async AI job processor uses `options.continuityBrief`, style, key, bpm, language, mood

### Collab
- `saveActiveRoom` attaches `room.continuity` snapshot
- Version history stores + restores continuity
- `Cloud.saveRoom` upserts `continuity` field
- SQL: `www/supabase-continuity.sql` — `rooms.continuity jsonb`

### Tests
- 39 passing

## v1.11.3 — Bugfix pass

### Critical
- **Service worker** still pinned to `1.10.56` / empty modular shell → users never got `js/state.js`, `js/cloud.js`, `js/continuity.js`. Updated to `tapehead-v1110-1` with full modular SHELL and network-first for `/js/`.
- **index.html** `data-app-version` + SW register query updated to 1.11.0 / `v1110`.

### Runtime
- **scheduleSave** called bare `saveCurrentSong` / `updateProjectContext` from strict `state.js` IIFE → now uses `window.*` with safe fallbacks; `updateProjectContext` bridged on `window`.
- **cloud.js** bare `toast(...)` → `window.toast`; null-safe `window.state` on auth SIGNED_OUT / profile cache.
- **saveRoom** no longer fails hard if `rooms.continuity` column missing (retry without field).
- **claimJob** handles PostgREST `null` / empty body without throwing.

### Tests
- `tests/version-sw.test.mjs` locks SW + version alignment
- Full suite green
