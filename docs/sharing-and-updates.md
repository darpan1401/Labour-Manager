# Sharing And Updates

## What this does

- Push to `main`
- GitHub Actions builds a signed Android APK
- The APK is uploaded to GitHub Releases as `labour-manager.apk`
- The app checks GitHub Releases and shows an update prompt when a newer version exists

## One-time setup

1. Keep these values set in [app.json](../app.json):
   - `expo.extra.appUpdate.enabled = true`
   - `expo.extra.appUpdate.githubOwner = darpan1401`
   - `expo.extra.appUpdate.githubRepo = Labour-Manager`
   - `expo.extra.appUpdate.apkAssetName = labour-manager.apk`
2. Keep `expo.android.package` unchanged after first release.
3. Keep using the same Android signing key for every build.
4. Keep the GitHub repo public so the app can read latest releases.

## Only 2 GitHub secrets needed

Go to `GitHub Repo -> Settings -> Secrets and variables -> Actions` and add:

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`

## Create the signing key once

```bash
keytool -genkeypair -v \
  -storetype JKS \
  -keystore upload-keystore.jks \
  -alias labourmanager \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

Convert it for GitHub:

```bash
base64 -w 0 upload-keystore.jks > keystore-base64.txt
```

Use:

- `ANDROID_KEYSTORE_BASE64` = content of `keystore-base64.txt`
- `ANDROID_KEYSTORE_PASSWORD` = keystore password

Optional shortcut with GitHub CLI:

```bash
chmod +x scripts/github-actions/set-github-secrets.sh
./scripts/github-actions/set-github-secrets.sh
```

## Daily release flow

1. Change app code.
2. Increase version in [app.json](../app.json):
   - `expo.version`
   - `expo.android.versionCode`
3. Push to `main`:

```bash
git add .
git commit -m "Release update"
git push origin main
```

4. Wait for `Actions -> Android Release`.
5. Download APK from:
   - `Releases -> latest release -> labour-manager.apk`
   - or `Actions -> latest run -> Artifacts`
6. Share that APK.

## Important notes

- User should install new APK over old app, not uninstall first.
- Same package name + same signing key = local data stays safe.
- App cannot silently install updates. User still taps update and installs the APK.
- If you forget to increase `expo.version` and `expo.android.versionCode`, update flow can fail.
