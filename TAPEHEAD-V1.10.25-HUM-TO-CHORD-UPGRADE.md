# Tapehead Pro v1.10.25 — Hum → Chord Upgrade

## Added
- Real-time pitch feedback remains visible while humming.
- Detected key and confidence are now populated from the actual analysis.
- Detected note contour is shown after analysis.
- Alternative chord progressions are generated from the detected key.
- Individual suggested chords can be auditioned.
- Hummed melody contour can be replayed.
- Existing chord progression can still be sent into Beat/Studio workflow.
- Existing Hum → Chord, scale lock, inversion, chord bank, and progression tools preserved.

## QA
- 17 inline JavaScript blocks: 0 syntax errors.
- `node --test tests/hum-engine.test.mjs`: PASS.
- Existing pitch/noise and major/minor progression assertions remain passing.
