# Tapehead Pro v1.10.27 — Clean Vocal Capture

## Goal
Make artist vocal recordings sound cleaner, more natural and more production-ready.

## Changes
- Music-first microphone constraints: echo cancellation, noise suppression and automatic gain disabled for vocal capture.
- Requests 48 kHz mono capture with low latency where supported, with graceful browser fallback.
- Records through a controlled Web Audio capture chain: 70 Hz high-pass, gentle low-mid cleanup, light presence lift, transparent compression and peak limiting.
- High-quality MediaRecorder bitrates: 256 kbps for Opus, 192 kbps for MP4/AAC where supported.
- Applies the same capture pipeline when recording over an uploaded backing track.
- Live waveform now monitors the processed capture signal.
- Added a visible Clean Vocal Capture quality indicator on the Record page.
- Existing timing/nudge, take management, Vocal Tune, Mix and export workflows preserved.

## QA
- 17 inline JavaScript blocks: 0 syntax errors.
- `npm test`: 2/2 suites passed.
