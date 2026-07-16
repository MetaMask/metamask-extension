# Passkeys domain for iOS
_Exported on 7/16/2026 at 09:56:49 GMT+2 from Cursor (3.11.19)_

---

**User**

If I use Passkeys in this react native app, which domain would it use on ios?

---

**Cursor**

I'll search the codebase for Passkey and iOS associated-domain configuration to find which domain iOS uses.


On iOS, this app is configured to use **`link.metamask.io`** for passkeys / web credentials.

That comes from the Associated Domains entitlement in both production and debug builds:

```11:21:ios/MetaMask/MetaMask.entitlements
	<key>com.apple.developer.associated-domains</key>
	<array>
		<string>applinks:metamask.io</string>
		<string>applinks:metamask.app.link</string>
		<string>applinks:metamask-alternate.app.link</string>
		<string>applinks:link.metamask.io</string>
		<string>applinks:link-test.metamask.io</string>
		<string>applinks:metamask.test-app.link</string>
		<string>applinks:metamask-alternate.test-app.link</string>
		<string>webcredentials:link.metamask.io</string>
	</array>
```

`MetaMaskDebug.entitlements` has the same `webcredentials:link.metamask.io` entry.

### What that means in practice

1. **iOS passkey domain** — The `webcredentials:` associated domain is what iOS uses to link passkeys between the app and a website. Here that domain is **`link.metamask.io`**, not `metamask.io`.

2. **WebAuthn `rpId`** — If you implement WebAuthn/passkeys, the relying party ID should be **`link.metamask.io`** to match the entitlement.

3. **Server-side requirement** — `https://link.metamask.io/.well-known/apple-app-site-association` must include a `webcredentials` entry for the app bundle ID (`io.metamask.MetaMask`, etc.).

4. **Test domain is not configured for passkeys** — `link-test.metamask.io` is listed for universal links (`applinks:`), but **not** under `webcredentials:`. So debug builds still use production passkey domain association.

### Current codebase state

There isn’t a dedicated passkey/WebAuthn library in the repo yet. The only related iOS credential plumbing today is `react-native-keychain`’s shared web credentials API (mocked in tests). The domain association is already set up in entitlements, but actual passkey flows would still need implementation and backend support aligned to `link.metamask.io`.

---

**User**

Which domain would it use on Android?

---

**Cursor**

I'll check Android manifest and asset-links configuration for the passkey/credential domain.


On Android, the answer is similar to iOS, but with an important caveat: **passkeys are not explicitly wired up yet**.

### Expected domain: `link.metamask.io`

That’s the domain used across the app for universal links and OAuth redirects, and it matches iOS:

```97:99:app/core/OAuthService/OAuthLoginHandlers/constants.ts
// Use universal link for OAuth redirect
export const GoogleRedirectUri = `${PROTOCOLS.HTTPS}://${AppConstants.MM_IO_UNIVERSAL_LINK_HOST}/${ACTIONS.OAUTH_REDIRECT}`;
export const AppRedirectUri = GoogleRedirectUri;
```

`MM_IO_UNIVERSAL_LINK_HOST` is `link.metamask.io`.

Android also verifies app links for that domain:

```108:122:android/app/src/main/AndroidManifest.xml
			<!-- MM App Links -->
			<intent-filter android:autoVerify="true">
				<action android:name="android.intent.action.VIEW" />
				<category android:name="android.intent.category.DEFAULT" />
				<category android:name="android.intent.category.BROWSABLE" />
				<data android:scheme="https" />
				<data android:host="link.metamask.io" />
			</intent-filter>
			<intent-filter android:autoVerify="true">
				...
				<data android:host="link-test.metamask.io" />
			</intent-filter>
```

### But passkey association is not configured yet

Unlike iOS (`webcredentials:link.metamask.io` in entitlements), Android has **no** passkey-specific setup in the repo:

- No `asset_statements` meta-data in `AndroidManifest.xml`
- No passkey/WebAuthn library
- No `delegate_permission/common.get_login_creds` in `assetlinks.json`

The live `assetlinks.json` at `https://link.metamask.io/.well-known/assetlinks.json` only declares `delegate_permission/common.handle_all_urls` (deep links), not `get_login_creds` (passkeys). Same for `link-test.metamask.io`.

### Summary

| Platform | Passkey domain | Status |
|----------|----------------|--------|
| **iOS** | `link.metamask.io` | Configured via `webcredentials:` entitlement + AASA |
| **Android** | `link.metamask.io` (expected) | App links only; passkey Digital Asset Links not set up |

So if you add passkeys on Android, you’d use **`link.metamask.io`** as the `rpId` (same as iOS), and you’d still need:

1. `delegate_permission/common.get_login_creds` in `assetlinks.json` for `io.metamask`
2. Optionally `asset_statements` in the manifest
3. App-side Credential Manager / WebAuthn implementation with `rpId: "link.metamask.io"`

`link-test.metamask.io` is only set up for test deep links, not passkeys.

---

**User**

on android simulator, i'm getting an error

---

**Cursor**

Investigating the passkey implementation and the Android simulator error.


The error **`Native error: Error: No create options available`** is Android’s `CreateCredentialNoCreateOptionException`. Credential Manager couldn’t find any provider willing to create a passkey for your request.

That usually comes down to **emulator setup** and/or **domain association**, not a bug in the button itself.

## What’s happening

Your dev passkey flow calls `Passkey.createPlatformKey()` with an `rpId` from `passkeyDevTest.ts`:

```23:27:app/core/Passkey/passkeyDevTest.ts
export const PASSKEY_RP_ID =
  (Platform.OS === 'android'
    ? process.env.PASSKEY_RP_ID_ANDROID
    : process.env.PASSKEY_RP_ID_IOS
  )?.trim() || AppConstants.MM_IO_UNIVERSAL_LINK_HOST;
```

So Android uses either:
- `PASSKEY_RP_ID_ANDROID` from `.js.env` (you have `matthiasgeihs.github.io`), or
- **`link.metamask.io`** if Metro wasn’t started with `.js.env` loaded

## Most likely causes

### 1. Missing Digital Asset Links for passkeys

Android requires the `rpId` domain to publish `/.well-known/assetlinks.json` with:

```json
"relation": ["delegate_permission/common.get_login_creds"]
```

Right now:
- **`link.metamask.io`** only has `delegate_permission/common.handle_all_urls` (deep links), not passkeys
- **`matthiasgeihs.github.io`** returns **404** for `/.well-known/assetlinks.json`

Without `get_login_creds`, Credential Manager has no valid create path → “No create options available”.

### 2. Emulator not ready for passkeys

On the Android emulator, also verify:

1. **Google Play image** (not plain AOSP)
2. **Signed into a Google account** (Settings → Passwords, passkeys & accounts)
3. **Screen lock set** (PIN/pattern/password) — passkeys require device security
4. **API 28+** (your code already checks this)

This is a common emulator-only failure even when DAL is correct.

### 3. Metro didn’t pick up `.js.env`

`PASSKEY_RP_ID_ANDROID` is inlined at bundle time via Babel. If you changed `.js.env` without restarting Metro, the app may still be using `link.metamask.io`.

Restart with:

```bash
yarn watch:clean
```

Then rebuild/relaunch the Android app.

## How to fix it

**Option A — Use your dev domain (recommended for local testing)**

1. Publish `assetlinks.json` at `https://matthiasgeihs.github.io/.well-known/assetlinks.json` with something like:

```json
[{
  "relation": ["delegate_permission/common.get_login_creds"],
  "target": {
    "namespace": "android_app",
    "package_name": "io.metamask",
    "sha256_cert_fingerprints": ["YOUR_DEBUG_KEYSTORE_SHA256"]
  }
}]
```

2. Get your debug cert fingerprint:

```bash
keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android | grep SHA256
```

(or `android/keystores/debug.keystore` depending on your build variant)

3. Restart Metro (`yarn watch:clean`) and relaunch the app.

**Option B — Test on a physical device**

Physical devices with Google Play Services + Google account + screen lock tend to work more reliably than emulators.

**Option C — Emulator-only workaround**

Sign into Google on the emulator and set a screen lock first. That alone sometimes fixes it, but you still need valid Digital Asset Links for the `rpId` you’re using.

---

**Quick check:** When create fails, note which `rpId` the success alert would show — if you add temporary logging, it should be `matthiasgeihs.github.io` when env is loaded, or `link.metamask.io` when it isn’t. That tells you which domain’s `assetlinks.json` you need to fix.

Want help setting up the GitHub Pages `assetlinks.json`, or improving the error message to show the active `rpId`?

---

**User**

<system_notification>
The following task has finished. If you were already aware, ignore this notification and do not restate prior responses.

<task>
kind: shell
status: aborted
task_id: 221213
title: Search react-native-passkey for error message
tool_call_id: tool_adca11ee-06ea-4a4c-bde9-db7f8d674f9
output_path: /Users/matthias/.cursor/projects/Users-matthias-source-consensys-metamask-mobile/terminals/221213.txt
</task>
</system_notification>
<user_query>Briefly inform the user about the task result and perform any follow-up actions (if needed). If there's no follow-ups needed, don't explicitly say that.</user_query>

---

**Cursor**

The background search in `react-native-passkey` didn’t find that string — which matches what we already saw: **"No create options available"** comes from Android’s Credential Manager (`CreateCredentialNoCreateOptionException`), not from the JS library. `react-native-passkey` passes it through as a generic native error.

So the fix is still on the Android side: set up Digital Asset Links (`get_login_creds`) for your `rpId`, sign into Google on the emulator, set a screen lock, and restart Metro after `.js.env` changes.

---

**User**

Passkey creation and verification on android simulator is now working after setting up the google account on the simulator.

Btw, i've checked out https://github.com/matthiasgeihs/matthiasgeihs.github.io.git into @matthiasgeihs.github.io/ , just in case.

---

**Cursor**

Good to hear the simulator is working. I'll quickly check what's in your local `matthiasgeihs.github.io` repo so I can note anything relevant for Android vs iOS.


Great — signing into Google on the emulator was the missing piece. Credential Manager needs an account (and usually a screen lock) before it can offer a passkey provider.

Your local [matthiasgeihs.github.io](https://github.com/matthiasgeihs/matthiasgeihs.github.io) repo is set up for **iOS** dev testing: it has `.well-known/apple-app-site-association` and `.nojekyll`, which is what you need for a real device with `PASSKEY_RP_ID_IOS=matthiasgeihs.github.io`.

One thing to keep in mind: it does **not** yet include `.well-known/assetlinks.json` with `delegate_permission/common.get_login_creds`. Android may work on the simulator without that, but if you want `matthiasgeihs.github.io` as the Android `rpId` on a physical device too, you’ll want to add that file with `io.metamask` and your debug keystore SHA-256.

For iOS on a real device, the repo README’s checklist still applies: iCloud Keychain on, and **Settings → Developer → Associated Domains Development** if you’re using the developer-mode associated domain entitlement.

---

**User**

hm, sorry, i think i spoke to early.
passkey creation and verification in the chrome browser is now working, and the metamask app got one step further: after clicking "Create Passkey", I'm presented with a Passkey creation screen.
However, after continuing, it fails with an error.

---

**Cursor**

The Google Password Manager prompt means we're past the first hurdle — I'll trace what happens after "Continue" and why it returns `RequestFailed`.


The Google Password Manager prompt means the emulator setup is fine — the failure after "Continue" likely means Digital Asset Links aren't verified for `matthiasgeihs.github.io`. I'll get your debug keystore fingerprint and add the missing `assetlinks.json`.


Google Password Manager is showing the prompt, but creation fails because `matthiasgeihs.github.io` has no `assetlinks.json` for Android. Adding it now.


That’s progress — you’re past the “no provider” stage. The Google Password Manager sheet means the emulator setup is fine.

The failure after **Continue** is almost certainly **Digital Asset Links verification**. Your app uses `rpId = matthiasgeihs.github.io` (from `.js.env`), but that domain only had the iOS AASA file — **no `assetlinks.json`** for Android. Google shows the UI, then rejects creation when it can’t verify the app ↔ domain link. That surfaces as `RequestFailed`.

I added the missing file locally:

`matthiasgeihs.github.io/.well-known/assetlinks.json`

It associates `io.metamask` with your debug keystore SHA-256 (`6F:9F:44:...`) via `delegate_permission/common.get_login_creds`.

### Next steps

1. **Push to GitHub Pages** (from the `matthiasgeihs.github.io` repo):

```bash
cd matthiasgeihs.github.io
git add .well-known/assetlinks.json README.md
git commit -m "Add Android assetlinks for passkey dev testing"
git push
```

2. **Verify it’s live:**

```bash
curl -i https://matthiasgeihs.github.io/.well-known/assetlinks.json
```

Expect `HTTP/2 200` with the JSON body.

3. **Retry on the emulator** — DAL can take a few minutes to propagate. If it still fails, try clearing **Google Play Services** cache (Settings → Apps → Google Play Services → Storage → Clear cache), then retry Create Passkey.

Chrome working in the browser is separate — browser passkeys don’t need your app’s `assetlinks.json`. The MetaMask app needs that file because it’s creating a passkey bound to `matthiasgeihs.github.io` as the relying party.

---

**User**

do i need to close the app? rebuild? or just retry on the running app?

---

**Cursor**

**Just retry** — no rebuild needed.

`assetlinks.json` is fetched by Google Play Services at passkey creation time, not bundled in the app. Your running build already has the right `rpId`; what was missing was the server-side file.

**After pushing and confirming the URL returns 200:**

1. Wait 1–2 minutes for GitHub Pages + Google’s DAL cache
2. Tap **Create Passkey** again in the running app

If it still fails:

- Clear **Google Play Services** cache (Settings → Apps → Google Play Services → Storage → Clear cache)
- Retry again

Force-stopping MetaMask can help in edge cases, but a full rebuild isn’t necessary for this change.

---

**User**

Hm, still failing.
Sometimes silently, sometimes with same error as before

---

**Cursor**

Still failing after the assetlinks change — I'll verify the live file, Android manifest/domain association, and the signing fingerprint.


Two likely gaps: `assetlinks.json` may need both DAL relations, and the app manifest may be missing `asset_statements`. I'll fix both for the dev passkey flow.


Two things were still missing — that explains getting to the Google Password Manager UI but failing on **Continue**.

### 1. `assetlinks.json` needs both relations

Android passkeys often need **both** `get_login_creds` **and** `handle_all_urls` in `assetlinks.json`, not just `get_login_creds`. With only the latter, creation can fail with `RequestFailed` ([details](https://jagdeep.me/blog/passkeys-on-android/)).

I updated your local `matthiasgeihs.github.io/.well-known/assetlinks.json` to include both. **Push that to GitHub Pages.**

### 2. The app must declare the domain association

The server file alone isn’t enough — the app also needs `asset_statements` in the manifest pointing at your `assetlinks.json`. That was missing.

I added debug-only config:
- `android/app/src/debug/res/values/strings.xml`
- `android/app/src/debug/AndroidManifest.xml`

**This one requires an Android rebuild** — manifest changes aren’t picked up by a hot reload.

### What to do now

1. **Push** the updated `assetlinks.json` to GitHub Pages
2. **Rebuild & reinstall** the Android debug app:
   ```bash
   yarn start:android
   ```
   (or your usual debug install flow)
3. **Clear Google Play Services cache** (Settings → Apps → Google Play Services → Storage → Clear cache)
4. **Retry** Create Passkey

So: push the JSON first, then rebuild the app — retrying alone won’t fix the manifest gap.

---

**User**

Working now 🥳

---

**Cursor**

Great to hear!

The full fix was the combination of:

1. **`assetlinks.json`** with both `get_login_creds` and `handle_all_urls`
2. **Debug `asset_statements`** in the Android manifest so the app declares the domain association
3. **Rebuild** so the manifest change took effect

You’re set for Android passkey dev testing with `rpId = matthiasgeihs.github.io`. When you move to production, you’ll need the same Digital Asset Links setup on `link.metamask.io` with the production signing cert.

