# Build Tapehead Pro as an Android APK

You have two paths:

---

## Option A — Install as PWA (no build tools, 2 minutes)

1. Host the `www/` folder anywhere (GitHub Pages, Netlify, or open `index.html` via a local server).
2. On Android Chrome, open the URL.
3. Tap the menu → **Install app** / **Add to Home screen**.
4. Tapehead opens fullscreen like a native app.

Share the link — anyone can install it.

---

## Option B — Real signed APK with Capacitor (recommended for sharing .apk files)

### Requirements
- Node.js 18+
- Android Studio (with Android SDK + JDK 17)
- A computer (Windows / Mac / Linux)

### Steps

```bash
# 1. Go into the project
cd tapehead-android

# 2. Install dependencies
npm install

# 3. Add Android platform (first time only)
npx cap add android

# 4. Copy web assets into the Android project
npx cap sync android

# 5. Open in Android Studio
npx cap open android
```

In Android Studio:
1. Wait for Gradle sync to finish.
2. Menu → **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
3. When done, click **locate** — you’ll get:
   `android/app/build/outputs/apk/debug/app-debug.apk`

### Release (shareable) APK
1. **Build → Generate Signed Bundle / APK**
2. Create a keystore (or use existing).
3. Build a **release** APK.
4. Share `app-release.apk` — users can install it (may need “Install unknown apps” enabled).

### One-liner after setup
```bash
npx cap sync android && cd android && ./gradlew assembleDebug
# APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Option C — Online (no local Android Studio)

1. Zip the entire `www/` folder.
2. Go to [https://www.pwabuilder.com](https://www.pwabuilder.com)
3. Enter your hosted URL (or use their package tool).
4. Download the Android package.

---

## Package contents

```
tapehead-android/
├── www/                  ← the full app (PWA)
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js
│   └── icon-*.png
├── package.json
├── capacitor.config.json
└── BUILD-APK.md          ← this file
```

App ID: `com.tapehead.pro`  
Version: 1.0.0
