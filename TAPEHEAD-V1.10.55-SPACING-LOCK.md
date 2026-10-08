# Tapehead Pro v1.10.55 — Spacing locked

## Guarantee
1. **DOM**: Write, Keys, Beat, Record, Mix, Feed, Collab all live inside `.app`.
2. **One page at a time**: `[hidden]` + ID selectors force `display:none` on inactive views.
3. **No stretch**: views use `flex:0 0 auto`, `height:auto`, `align-self:flex-start`.
4. **Bottom clearance**:
   - Write / Feed / Collab → `--th-nav-clear` (~64px + safe-area)
   - Beat / Keys / Record / Mix → `--th-studio-clear` (~108px + safe-area for subnav)
5. Removed legacy 170px / 195px / sticky-era 24px / under-clear 12px feed paddings.

## Also retained
- Sound Library `window.unlockAudio` / `ensureAudio` / `playSampleBuffer`
- Sidebar z-index above bottom nav

## Version
1.10.55 · cache tapehead-v11055
