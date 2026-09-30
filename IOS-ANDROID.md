# Tapehead Pro — Android + iOS

Tapehead uses one shared web codebase (`www/`) with Capacitor native shells for both Android and iOS.

## Install dependencies

```bash
npm install
```

The project declares both `@capacitor/android` and `@capacitor/ios`.

## Android

Requires Android Studio and the Android SDK.

```bash
npm run cap:add:android
npm run cap:sync:android
npm run cap:open:android
```

Merge `android-template/AndroidManifest.additions.xml` into the generated Android manifest if the native project does not already declare microphone permission.

## iOS

Requires macOS, Xcode, and an Apple Developer account for device/TestFlight/App Store distribution.

```bash
npm run cap:add:ios
npm run cap:sync:ios
npm run cap:open:ios
```

Merge `ios-template/Info.plist.additions.xml` into the generated iOS target Info.plist. The microphone usage description is required because Tapehead records vocals and hum melodies.

## Both platforms

After changing files in `www/`:

```bash
npm run cap:sync:all
```

Then open the platform project in Android Studio or Xcode.

## Audio compatibility

Tapehead selects a recording MIME type supported by the current browser/WebView. It prefers MP4/AAC when available (common on Apple platforms), then WebM/Opus and Ogg/Opus fallbacks.

## Important testing

Test on real devices before store submission:

- microphone permission
- vocal recording and playback
- Bluetooth/AirPods
- app background/foreground transitions
- PWA/native storage
- login/session restoration
- payment redirect and return
- audio upload/download
- iPhone safe areas and Android navigation bars
