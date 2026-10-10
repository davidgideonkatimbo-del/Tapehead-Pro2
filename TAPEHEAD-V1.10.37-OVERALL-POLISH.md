# Tapehead Pro v1.10.37 — Overall Production Polish

## Focus
A regression-hardening pass built from v1.10.36 without removing features.

## Fixes
- Made all UI buttons explicit `type="button"` controls to prevent accidental form submission/navigation behavior.
- Replaced timestamp-only project IDs with collision-safe IDs using `crypto.randomUUID()` when available, with a safe fallback.
- Preserved refresh workspace restoration and Studio sub-view state.
- Preserved the fixed mobile Studio sub-navigation and bottom navigation layers.
- Preserved Feed owner deletion, Sound Library namespace separation, Beat Engine stability, Clean Vocal Capture, and Studio color refinement.
- Refreshed service-worker cache/version to v11039.

## QA
- Automated test suites: 2/2 passing.
- Inline JavaScript syntax: checked after packaging.
