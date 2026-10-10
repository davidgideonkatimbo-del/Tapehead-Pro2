# Tapehead Pro — Target Mature Architecture

**Version target:** v1.11.0+ (maturity series)  
**Goal:** Make the product hard to copy through engineering depth while keeping the fast mobile-first experience.

---

## 1. Design Principles

1. **Client is presentation + interaction.** Secrets, metering, AI orchestration, and durable work live on the server.
2. **Durable jobs** for anything that can take more than a couple of seconds (AI generation, bounce, export, heavy audio).
3. **Clear domain boundaries** — Write, Beat, Studio, Social, Pro are separate modules with explicit interfaces.
4. **Progressive enhancement** stays: guest mode remains usable offline/local.
5. **Behavioral tests** protect the money paths.
6. **Security by default** — rate limits, entitlement checks, and validation happen server-side on every valuable action.

---

## 2. Target Directory Structure

```
tapehead/
├── client/                          # Frontend only (evolves from current www/)
│   ├── src/
│   │   ├── app/                     # Shell, routing, auth gate, theme
│   │   ├── write/                   # Write studio + AI lyrics UI
│   │   ├── beat/                    # Beat engine, kits, patterns
│   │   ├── studio/                  # Record, Mix, Bounce, arrangement
│   │   ├── feed/                    # Social feed
│   │   ├── collab/                  # Realtime rooms + presence
│   │   ├── pro/                     # Client-side Pro UI only
│   │   ├── shared/
│   │   │   ├── state.js
│   │   │   ├── persistence.js
│   │   │   ├── audio-core.js
│   │   │   └── ui.js
│   │   └── cloud/                   # Supabase client wrapper
│   └── public/                      # index.html, icons, sw.js, manifest
│
├── server/                          # Real backend logic
│   ├── api/                         # Thin Vercel handlers (keep)
│   ├── services/
│   │   ├── ai.js                    # Prompt building, fallbacks, metering
│   │   ├── jobs.js                  # Claim / complete / fail jobs
│   │   ├── pro.js                   # Entitlements (extend current _pro.js)
│   │   ├── security.js              # Rate limits, validation
│   │   └── audio.js                 # Future server-side bounce/export
│   └── worker/                      # Optional background processor later
│
├── supabase/                        # All SQL versioned
├── tests/                           # Behavioral + unit
└── docs/
```

---

## 3. Module Map of Current `app.js` (v1.10.56)

| Approx lines | Current section              | Target module              |
|-------------|------------------------------|----------------------------|
| 2–1076      | Cloud layer (Supabase)       | `client/src/cloud/`        |
| 1077–1180   | UX v2 engine                 | `client/src/shared/ui.js` + app shell |
| 1181–2540   | Vocal record + audio core    | `client/src/studio/` + `shared/audio-core.js` |
| 2541–3012   | AI Lyrics Engine             | `client/src/write/ai-ui.js` (calls server) |
| 3013–3497   | Write sections engine        | `client/src/write/`        |
| 3498–4406   | Auth & Social (local+cloud)  | `client/src/app/auth.js` + cloud |
| 4407–5128   | Collaboration Rooms           | `client/src/collab/`       |
| 5129–6034   | Pro / Monetization           | `client/src/pro/` + server |
| 6035–6649   | Follow + Messages            | `client/src/feed/`         |
| 6650–7268   | Sidebar safety               | `client/src/app/shell.js`  |
| 7269–7602   | Feature pass utilities       | distribute into domains    |
| 7603–end    | Write Studio premium layer   | `client/src/write/premium.js` |

**State & persistence** currently scattered → become `shared/state.js` + `shared/persistence.js`.

---

## 4. Durable Jobs (Core Moat Pattern)

New table (add to Supabase):

```sql
create table if not exists public.tapehead_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('ai_generate','bounce','export','stem_render')),
  status text not null default 'queued'
    check (status in ('queued','running','succeeded','failed','canceled')),
  priority int not null default 5,
  payload jsonb not null default '{}',
  result jsonb,
  error text,
  attempts int not null default 0,
  worker_id text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  expires_at timestamptz
);

create index if not exists tapehead_jobs_claim_idx
  on public.tapehead_jobs (status, priority, created_at)
  where status = 'queued';

-- SECURITY DEFINER claim function (service_role only) — same pattern as Avirzo
```

**Flow:**
1. Client requests AI / bounce → server creates job row + returns job id.
2. Server (or worker) claims job, performs work, writes result.
3. Client polls or subscribes to status.
4. Usage is counted once per successful job, not per attempt.

This alone makes simple API cloning insufficient.

---

## 5. Server Service Boundaries

| Service | Responsibility |
|---------|----------------|
| `ai.js` | Build prompts, call model(s), apply fallbacks, enforce rate + Pro limits, write job result |
| `jobs.js` | create / claim / complete / fail / cancel |
| `pro.js` | Entitlement resolution, trial, metering windows |
| `security.js` | IP + user rate limits, input validation, SSRF-safe fetches if media is involved |
| `audio.js` | Future: server-side bounce / stem export |

Existing thin routes (`/api/ai`, `/api/pro-*`) stay as entry points and call into these services.

---

## 6. Security & Metering Rules (Non-negotiable)

- Every AI and Pro action re-validates entitlement **on the server**.
- Rate limits are enforced server-side (current 30/hour is a start; make it plan-aware).
- Service role key never reaches the browser.
- Guest mode cannot burn paid AI quota.
- Job results are scoped to the owning user via RLS + service checks.

---

## 7. Testing Strategy

Expand `tests/` into:

- **Behavioral** (preferred): read source + HTML and assert critical contracts (already started).
- **API contract tests** for `/api/ai`, `/api/pro-*` (mock env).
- Later: real integration tests against a test Supabase project.

Critical paths that must have tests:
1. AI route rejects unauthenticated / non-Pro / over-limit
2. Pro entitlement resolution
3. Project save integrity (cloud + local)
4. Guest → signed-in migration
5. Job create → claim → complete happy path

---

## 8. Migration Strategy (No Big Bang)

1. **Keep `www/` working** at all times.
2. Extract modules one domain at a time behind the same global bridges that already exist (`Object.assign(window, …)`).
3. Introduce jobs table + server job helpers without changing UI first.
4. Point AI and Bounce at jobs once stable.
5. Only then move files into `client/src/` structure (or keep flat modules under `www/js/` if preferred for Vercel simplicity).

---

## 9. Success Criteria for “Hard to Copy”

- Valuable work requires server + valid entitlement + job record.
- Core logic is modular and tested, not one reverse-engineerable file.
- Musical/project continuity rules live in code that competitors must re-implement.
- Cloning the frontend alone does not yield a working Pro product.
