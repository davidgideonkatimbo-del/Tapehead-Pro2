# Tapehead Pro v1.10.0 — Native shell

## Native (Capacitor)
- StatusBar dark + SplashScreen hide
- Android back: dismiss overlays → leave Studio → minimize
- App background: stop transport, suspend audio, cloud flush
- App foreground: resume AudioContext
- Safe-area CSS when `html.is-native`

## Prior 1.10.0 cohesion
- Mix state persistence (EQ/pan/glue/swing)
- Live multi-bus + meter + master FX
- Stem ZIP export

SW: `tapehead-v1100` · package.json `1.10.0`

## Smoke
1. `npx cap sync` → open Android/iOS
2. Back button hierarchy works
3. Background stops playback
4. EQ/Glue still color bounce
