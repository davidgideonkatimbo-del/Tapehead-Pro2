# Tapehead Pro v1.10.53 — Sound Library Fix

## Problem
Tapping built-in kits on the Beat page (808 Sub, Boom Bap, Trap Hard, etc.) showed:
`Could not load kit: unlockAudio is not defined`

## Cause
The main app runs inside an IIFE (`(()=>{ ... })()`), so `unlockAudio`, `ensureAudio`, and
`playSampleBuffer` were not global. The Sound Library lives in a **separate** script and
could not see those helpers.

## Fix
- Export `window.unlockAudio`, `window.ensureAudio`, and `window.playSampleBuffer` from the main app.
- Harden `SoundLibrary.loadKit` to use `window.*` helpers, with a small AudioContext fallback.
- `renderPart` uses `window.ensureAudio` when creating buffers.
- Cache: `tapehead-v11053`. Version: `1.10.53`.
