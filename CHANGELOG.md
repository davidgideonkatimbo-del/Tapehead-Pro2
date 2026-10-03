# Tapehead Pro Changelog

## 1.10.15
- Vocal Tune (auto-tune) on the Record page: Off / Natural / Pop / Hard. Corrects the active take (pitch-tracked, PSOLA, plain JavaScript, no worklet); Off restores the original voice
- Voice polish: recordings sounded saggy and unclear because the mic was captured with the browser's voice-call processing (echo cancel, noise suppression, auto gain) and a low bitrate. Capture is now clean at 256 kbps, and a new Clean voice step (on by default) removes rumble and hiss, cuts low-mid mud, tames harsh s sounds, evens out loudness and adds presence and air. The original is always kept; Off restores it
- New Speakers chip: tick it if the beat plays out loud so echo cancelling stays on
- Auto-tune pitch marks now lock to one peak per period (fixes an occasional octave-down growl on some voices)
- Messages now always show the artist's name. Names come from the public artist profiles (not the private profile row), are remembered between syncs, and a message from someone else is never labelled with your own name or a raw ID. Inbox rows show the artist and "You:" on your own last message; the chat header says who it is private with; incoming bubbles are labelled; the box reads "Message <name>…"
- Snap scale now means something: tick it to tune to the song key and scale, otherwise it snaps to the nearest note
- Pick a style before recording and new takes are tuned automatically after you stop
- Added the missing WAV encoder used by the mix bounce (audioBufferToWavBlob was called but never defined)
- Fixed GRID chips (1/8, 1/16, 1/32) and Sound library kits: later scripts called functions hidden inside the main script (thRes, unlockAudio, ensureAudio, buildTracks, saveCurrentSong, stopTransport and others), which caused the load error "thRes is not defined" and "Could not load kit". They are now exposed to those scripts
- Take names count correctly (Take 1, Take 2 instead of Take 01, Take 11)

## 1.10.14
- Sound library kits are now synthesized in plain JavaScript (no OfflineAudioContext), fixing "Could not load kit"; real error shown if anything else fails

## 1.10.13
- Library sheet (search, open, duplicate, delete); menu badge shows project count
- Every project goes to the Library: first save auto-creates one; demo beat is saved as summer-beat-03
- Clearer beat: hats/snare/clap raised, mud cut + presence boost, slower compressor attack, makeup gain + limiter (live and bounce)

## 1.10.12 — Grid resolution
- New GRID chips: 1/8, 1/16, 1/32 (steps chips 8/16/32 unchanged)
- Grid is stored with the pattern; playback, transport readout, arrangement, feed playback and bounce all follow it
- Switching grid converts the pattern so it sounds the same; genre presets expand to the chosen grid
- Bounce now uses the same accents as live playback

## 1.10.11 — Beat groove polish
- Genre presets now fill the whole 2-bar grid (previously bar 2 was silent) with a small bar-2 fill
- Accents on kick/hat so the groove breathes (deterministic, no random variation)

## 1.10.10
- Sound library: 5 built-in kits (808 Sub, Boom Bap, Trap Hard, Lo-fi Tape, Afro Dance) synthesized by the app, level-matched, with audition
- MP3 export option for the full mix (192 kbps; encoder loaded on demand, falls back to WAV)

## 1.10.9
- First visit loads the "summer-beat-03" demo beat (100 BPM) and shows 3 tooltips
- Swipe the piano left/right to change octave

## 1.10.8
- Menu: Sounds, Library and Export now open real destinations
- Master bounce and stem export require Pro (lock icon + paywall)
- Optional UGX pricing: set PRO_CURRENCY=UGX (monthly defaults to UGX 25,000)

## 1.10.7 — Beat polish
- One shared drum engine for live playback and bounce (identical sound)
- Seeded noise: every hat/snare/clap hit is identical (no random variation, less CPU)
- Fixed drum volume being applied twice during live playback
- Punchier kick (click + click-free attack), snare body tone, filtered hats and claps
- Custom samples play at full level with a short end fade (no decay chop)
- Master: 28 Hz subsonic filter + safety limiter in live and bounce
- Steadier scheduling (longer lookahead, safer start offset)

## 1.10.6
- Clear message when the server can't be reached (instead of "Failed to fetch")

## 1.10.5 — Polish
- Accessibility: icon buttons get labels, buttons default to type=button, toast announced to screen readers
- Disabled button styling, text-selection color, thin scrollbars

## 1.10.3
- Arrangement: live section highlight during form preview
- Arrangement: duplicate section (＋)
- Editable bars + Preview form (from 1.10.2)

## 1.10.2
- Arrangement live preview through full form
- Per-section bar length editing

## 1.10.1
- Arrangement drives bounce length and vocal placement
- On/Off, reorder, reset form sections

## 1.10.0
- Mix state persistence (EQ, pan, glue, swing, chords)
- Live multi-bus graph + analyser meter
- Master 3-band EQ + Glue compressor (live + bounce)
- Stem ZIP export
- Custom sample kits
- Native Capacitor shell (back button, audio suspend, safe areas)
- Studio hub nav (Write · Studio · Feed · Collab)

## 1.9.9 elevation (UX review)
- Guest mode + onboarding
- Hum→Chord hero polish
- Multi-take vocals + swing
- Contextual section AI
- Feed discovery filters + share card
- Project context bar
- Collab presence + version snapshots
- Glass UI polish

## Architecture notes
Monolithic PWA (`www/index.html`) + service worker. Audio via Web Audio API multi-bus graph. Capacitor for store builds.

## 1.10.4 — Device QA
- Guest can create/use a local project (newSong no longer hard-requires sign-in)
- Fixed guest enterGuestMode ↔ closeAuth recursion risk
- Hardened startTransport + null-safe pattern scheduler
- Pause transport + suspend audio when tab/app hidden; unlock on visible
- Space bar transport works in guest mode
- iOS: arrangement bar inputs use 16px (no focus zoom)
- Menu bounce routes to multi-bus doMixdown (no vocal required)
