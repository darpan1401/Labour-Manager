# Sharing And Updates

## What this setup does

- Build a shareable Android APK without using the Play Store.
- Check GitHub Releases from inside the app.
- Show an in-app update prompt when a newer APK is available.
- Keep local app data when the new APK is installed over the existing app.

## One-time setup

1. Create a GitHub repository for this app.
2. Push this project to that repository.
3. In [app.json](../app.json), fill these values under `expo.extra.appUpdate`:

   - `enabled`: `true`
   - `githubOwner`: your GitHub username or org
   - `githubRepo`: repository name
   - `apkAssetName`: APK file name you upload to releases, for example `labour-manager.apk`

4. Keep `android.package` unchanged after your first shared build.
5. Keep using the same signing key for every Android build.

## Build an APK to share

1. Install EAS CLI:

   ```bash
   npm install -g eas-cli
   ```

2. Login:

   ```bash
   eas login
   ```

3. Configure the project the first time:

   ```bash
   eas build:configure
   ```

4. Build the APK:

   ```bash
   npm run build:android:apk
   ```

5. Download the generated APK and share it directly on WhatsApp, Drive, Telegram, or GitHub Releases.

## Publish a future update

1. Update the app version in [app.json](../app.json):

   - Increase `expo.version`
   - Increase `expo.android.versionCode`
   - Increase `expo.ios.buildNumber` if you later build iPhone versions

2. Build a fresh APK:

   ```bash
   npm run build:android:apk
   ```

3. Create a GitHub Release:

   - Tag name should match your app version, for example `v1.0.1`
   - Upload the APK asset with the exact name from `apkAssetName`
   - Put your update notes in the release description

4. When your user opens the app, it will check the latest GitHub Release and show an update prompt.

## Important notes

- Android users should install the new APK over the old app. They should not uninstall first.
- If the package name and signing key stay the same, the app updates in place and local saved data remains.
- If you change the package name or signing key, Android treats it like a different app and local data can be lost.
- iPhone direct sharing is different. For iPhone, use TestFlight or Apple distribution.

## Good release habit

- Keep APK asset name fixed, for example `labour-manager.apk`
- Keep tag names version-based, for example `v1.0.0`, `v1.0.1`, `v1.1.0`
- Add short notes like:

  ```text
  - Faster report sharing
  - Better labour storage
  - Fixed attendance labels
  ```
