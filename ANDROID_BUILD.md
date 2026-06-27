# Building & Installing the Android APK

This project is a normal web app (works in your browser preview) **plus** a Capacitor wrapper that lets it be packaged into an installable Android APK.

## Option A — Automatic build via GitHub Actions (recommended, no Android Studio needed)

1. In Lovable, open the **GitHub** menu (top-right `+` menu) and connect this project to a GitHub repository.
2. Once connected, GitHub Actions will automatically run the workflow defined in `.github/workflows/android.yml` on every push.
3. After ~5 minutes, go to your repo on github.com → **Actions** tab → click the most recent “Build Android APK” run → scroll to **Artifacts** → download **`brass-orders-debug-apk`**.
4. Unzip it on your phone (or transfer the `app-debug.apk` to your phone via USB / Google Drive / WhatsApp to yourself).
5. On your phone, tap the APK file. Android will ask you to **allow installs from this source** — enable it once, then tap **Install**.

The APK is *debug-signed*, which means Android shows a one-time warning. It installs and runs normally. It is NOT publishable to the Play Store as-is, but for personal workshop use it's perfect.

## Option B — Build locally on your computer

Prerequisites: **Node 20+**, **JDK 17**, and **Android Studio** (for the SDK).

```bash
git clone <your-repo-url>
cd <repo>
npm install
npm run build:mobile        # creates dist-mobile/
npx cap add android         # only needed the first time
npx cap sync android
cd android
./gradlew assembleDebug
```

The APK appears at `android/app/build/outputs/apk/debug/app-debug.apk`.

## Updating the app

Every time you change code:

```bash
npm run build:mobile && npx cap sync android && (cd android && ./gradlew assembleDebug)
```

Or just push to GitHub and download a fresh APK from the Actions tab.

## Notes

- All data is stored on-device via `localStorage` — fully offline, no login.
- The product catalog (363 items) is baked in at `src/data/catalog.ts`. Edit and rebuild to update.
- Sharing uses the native Android share sheet (so you can send the summary to WhatsApp). Copying uses the native clipboard.
