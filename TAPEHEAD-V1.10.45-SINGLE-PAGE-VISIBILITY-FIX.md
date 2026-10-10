# Tapehead Pro v1.10.45 — Single-Page Visibility Fix

## Fix
- Fixed Feed being displayed together with Record, Mix, or another selected page.
- Feed content sizing remains content-driven, but its display override now applies only when Feed is NOT hidden.
- Preserved the existing `setView()` navigation model so only the selected `.view` is visible.
- Refreshed app/service-worker version to 1.10.45 / v11045.

## QA
- Verified the seven primary `.view` sections are siblings, not nested.
- Verified `setView()` hides all `.view` elements before showing the selected view.
- Verified the Feed CSS selector cannot match when `hidden` is present.
