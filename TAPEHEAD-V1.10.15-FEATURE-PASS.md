# Tapehead Pro v1.10.15 — Feature Pass

Implemented from the requested five upgrades:

1. Add your own music
- Record Vocal now accepts MP3/WAV/M4A/AAC/OGG/FLAC backing tracks.
- Uploaded backing tracks are used as the recording bed.
- The uploaded file is stored locally per project with IndexedDB so it can survive reloads on the same device/browser.
- Remove/reload controls are included.

2. Microphone timing
- Added a -500 ms to +500 ms timing slider in 10 ms steps.
- The value is saved into the active vocal take.
- Existing nudge controls remain available and stay synchronized with the slider.

3. Separate downloads
- Existing stem ZIP remains available.
- Added one-click WAV downloads for Full, Drums, Piano/Keys (chord bus), and Vocal.

4. Better rhyme helper
- Kept the existing curated rhyme map.
- Added an expanded offline rhyme-family dictionary fallback for substantially broader songwriting coverage.

5. Phone usability
- Beat step rows now scroll horizontally on small screens instead of crushing 32 steps into tiny targets.
- Mobile recording, writing, and export controls use better two-column layouts.
- Touch targets were increased where appropriate.

Validation:
- script_3.js passes Node syntax checking.
- index.html contains the updated application script and all new UI IDs.
- Static feature wiring checks passed for all five requested areas.

## v1.10.16 Beat Maker Upgrade
- Beat Maker command header: BPM −/+, Tap Tempo.
- Groove presets: Straight (0%), Pocket (12%), Bounce (25%), Shuffle (40%).
- Step pads support four states: Off, Soft, Normal, Accent.
- Velocity-aware playback and bounce use the existing Web Audio drum engine.
- Existing 0/1 patterns remain valid; no migration is required.
- Step pads include keyboard accessibility and clearer state labels.
- Mobile layout keeps tempo and groove controls usable without shrinking the sequencer.
