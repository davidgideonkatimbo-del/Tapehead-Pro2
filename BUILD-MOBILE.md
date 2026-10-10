# Tapehead Pro v1.10.0 — Android & iOS

Same `www/` web app runs as **PWA** and as **Capacitor native** apps.

## Native shell (built-in)

When running inside Capacitor:
- Dark status bar + splash hide on launch
- **Back button** closes modals / leaves Studio tools before minimizing
- **Background**: stops transport, suspends AudioContext, flushes cloud save
- **Foreground**: resumes audio + unlock
- Safe-area padding for notch devices (`html.is-native`)

## Option A — PWA (no store)

### Android Chrome
Open the live site → Install app / Add to Home screen

### iOS Safari
Share → Add to Home Screen → launch from icon

## Option B — Capacitor (Play Store / App Store)

```bash
cd tapehead-full   # or your project root
npm install
npx cap add android   # once
npx cap add ios       # once (Mac)
npx cap sync
npx cap open android  # Android Studio → Build APK/AAB
npx cap open ios      # Xcode → Archive
```

After every web change:
```bash
npx cap sync
```

### Config
- `appId`: `com.tapehead.pro`
- `webDir`: `www`
- Splash / StatusBar: dark `#0A0A0C`

### Permissions to verify in native projects
- **Microphone** — Hum → Chord + Record
- **Internet** — cloud auth / collab / payments
- **Optional storage** — large bounce files on older Android

## Smoke on device
1. Install / open app → splash then studio
2. Play a beat → background the app → transport stops
3. Return → audio resumes after interaction
4. Open a modal → hardware back closes it
5. Bounce Full Mix / Export Stems ZIP
