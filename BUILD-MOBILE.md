# Tapehead Pro — Android & iOS

The same `www/` web app runs on **both** platforms.

---

## Option A — Progressive Web App (fastest, no store)

Works on **Android Chrome** and **iOS Safari**.

### Android
1. Open your live site (GitHub Pages / Netlify / etc.) in **Chrome**
2. Menu → **Install app** / **Add to Home screen**
3. Opens fullscreen like a native app

### iOS (iPhone / iPad)
1. Open the site in **Safari** (not Chrome)
2. Tap **Share** → **Add to Home Screen**
3. Name it **Tapehead** → Add
4. Launch from the home screen (standalone mode)

**Note:** iOS requires Safari for install. Mic, audio, and storage work in standalone mode on modern iOS.

---

## Option B — Native apps with Capacitor (Play Store + App Store)

### Prerequisites
- Node.js 18+
- For Android: Android Studio
- For iOS: **Mac** + Xcode + Apple Developer account ($99/year)

### One-time setup
```bash
cd tapehead-android
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init "Tapehead Pro" com.tapehead.pro --web-dir www
# config already present in capacitor.config.json
npx cap add android
npx cap add ios
npx cap sync
```

### Android APK / AAB
```bash
npx cap open android
# In Android Studio: Build → Build Bundle(s) / APK(s)
# Or: ./gradlew assembleRelease
```

### iOS (Mac only)
```bash
npx cap open ios
# In Xcode: select team, signing, device/simulator
# Product → Archive → Distribute to App Store or TestFlight
```

After any web update:
```bash
# copy latest index.html into www/
npx cap sync
```

---

## What works on both

| Feature | Android | iOS |
|--------|---------|-----|
| Write / AI lyrics | ✓ | ✓ |
| Piano / Beat / Mix | ✓ | ✓ |
| Hum → Chord (mic) | ✓* | ✓* |
| Install to home screen | ✓ | ✓ (Safari) |
| Offline shell (SW) | ✓ | Limited on iOS |
| Capacitor store build | ✓ | ✓ (Mac) |

\* Microphone requires user permission on first use.

---

## Recommended path

1. **Now:** Host as PWA → both Android & iPhone users install from browser  
2. **Later:** Capacitor builds when you want Play Store + App Store listings  
