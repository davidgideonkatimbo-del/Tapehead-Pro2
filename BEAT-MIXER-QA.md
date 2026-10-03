# Tapehead Beat Mixer — Functional QA

## Verified in source

- Transport play/stop and scheduler remain connected to the fixed live audio engine.
- Kick, Snare, Hi-Hat and Clap step pads audition immediately when enabled.
- 8 / 16 / 32 step lengths rebuild the sequencer correctly.
- 1/8 / 1/16 / 1/32 grid resolution is stored and applied to timing.
- Clear, Randomize and Duplicate pattern tools remain wired.
- Swing affects scheduler timing.
- Genre Kit selection replaces the drum pattern and saves the project.
- Built-in sound kits synthesize/load Kick, Snare, Hat and Clap voices.
- Custom sample slots load browser audio samples and clear correctly.
- Track faders affect drum playback level.
- Mute and Solo affect playback and are persisted with projects.
- Beat Lab Pro Groove controls affect playback: Swing, Humanize timing, Velocity and Probability.
- AI Beat Generator changes the actual pattern; Lo-Fi is included as a selectable AI genre.
- Variation changes the pattern; Simplify removes optional hits while preserving core kick/snare anchors; Make Harder increases density.
- Subtle, Medium and Crazy fills alter the ending of the pattern.
- Drop removes the first half of the current pattern.
- Intro, Verse, Chorus and Outro templates alter the pattern.
- 808 Bass Lane has independent root, octave, volume, glide and 16-step playback.
- 808 Bass Lane is included in offline bounce/export through the drum bus.
- Beat DNA recalculates Energy, Groove, Density and Variation after pattern/groove changes.
- Remix DNA mutates the pattern and changes groove.
- Drum FX Drive, Air and Glue are connected to the dedicated drum FX bus in live playback.
- The same Drum FX chain is present in offline bounce/export.
- Premium settings, bass state, mute/solo state and mix state are saved with the project.
- Premium controls are restored to their saved UI values when a project is loaded.
- Service-worker cache version was bumped so deployed clients can receive the patched Beat Mixer.

## Validation

- All inline JavaScript blocks in `www/index.html`: syntax check passed.
- `www/sw.js`: syntax check passed.
- Beat Mixer controls were checked against their DOM IDs and implementation handlers.

## Note

Custom uploaded audio samples are session data; the browser AudioBuffer itself is not serialized into the project JSON. The sample name can be saved, but the actual uploaded sample must be loaded again after a fresh browser session unless a future IndexedDB sample-storage layer is added.
