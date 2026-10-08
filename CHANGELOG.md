## 1.10.56 — Load-speed quick wins
- Feed loads 30 posts first with a "Load more posts" button (was 80 at once); artist profiles still fetch up to 80 of that artist's posts.
- Realtime refresh now waits 1.5s to batch bursts of likes/comments and pauses while the tab is hidden.
- Feed likes and comments load in parallel; artist profiles fetch only that artist's posts; chat peer profiles are cached for 5 minutes.
- Google Fonts no longer block first paint; added preconnect for jsDelivr and Supabase.
- Avatar images lazy-load; added cache headers for icons/OG image and revalidation for the app shell.

## 1.10.26 — Production Bug-Fix Pass
- Corrected stale app/package version metadata to 1.10.26.
- Added the missing automated `npm test` command for the existing test suites.
- Fixed an accidental global assignment in AI Beat generation.
- Bumped the service-worker cache version so deployed mobile shells refresh cleanly.
- Re-ran Hum → Chord and Pesapal flow regression tests.

# Tapehead Pro Changelog

## 1.10.16 — Beat Maker Upgrade
- Added a premium Beat Maker header with fast BPM controls and Tap Tempo.
- Added Straight, Pocket, Bounce and Shuffle groove presets.
- Beat pads now cycle Off → Soft → Normal → Accent for more expressive programming.
- Accent/soft velocity is preserved in playback and offline bounce while remaining compatible with existing binary patterns.
- Added step accessibility labels and keyboard activation.
- Added live hit/accent count and clearer beat-programming guidance.


## 1.10.15
- Vocal Tune (auto-tune) on the Record page: Off / Natural / Pop / Hard. Corrects the active take (pitch-tracked, PSOLA, plain JavaScript, no worklet); Off restores the original voice
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

## v1.10.18 — Feed Clean Social Upgrade
- Simplified Feed navigation into For You, Popular, Following, and Collab.
- Moved genre/media filters behind a compact Filters control.
- Added compact artist/song search treatment and refresh control.
- Added Following filtering using local/cloud follow relationships.
- Simplified post actions to like, comment, remix, and context-aware vocal action.
- Improved Feed spacing and mobile-first social listening layout.

## v1.10.20 — Collab Focused
- Simplified Collab lobby around New room and Join a room.
- Added lightweight artist discovery for profiles marked Open to collab.
- Added direct artist profile entry from discovery cards.
- Moved My rooms into a collapsible section to reduce clutter.
- Improved mobile layout for artist cards and room-code entry.
- Preserved existing collaboration rooms, section claiming, beat sync, vocals, chat, snapshots and version history.
