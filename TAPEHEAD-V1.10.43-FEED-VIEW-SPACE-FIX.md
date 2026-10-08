# Tapehead Pro v1.10.43 — Feed View Space Fix

## Fixed
- Feed view was leaving a large empty workspace on mobile when its content was not being visibly laid out.
- Feed is now explicitly content-sized and displayed as a normal block when selected.
- Feed card and feed content are forced to auto height/min-height so they cannot inherit a full-screen empty layout.
- Bottom Feed navigation reasserts the correct visible Feed layout after tap.
- Existing Feed scrolling remains available when posts make the content taller than the viewport.
- Service-worker cache bumped to v11043.

## QA
- Version: 1.10.43
- Existing automated test suites retained.
