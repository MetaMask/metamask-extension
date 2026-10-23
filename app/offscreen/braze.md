# Braze identity

Braze identifies users with the primary SRP's Profile Sync canonical profile
ID, the same `external_id` Mobile uses. The SDK runs once, in the MV3 offscreen
document. MV2 (Firefox) builds do not include Braze.

## Ownership

- `BrazeService` (`app/scripts/services/braze-service.ts`, background) owns the
  gates. It listens to `OnboardingController`, `PreferencesController`
  (`useExternalServices`), `AuthenticationController`, and `KeyringController`,
  and sends the desired user to the offscreen document when it changes.
- `app/offscreen/braze.ts` applies that user. It holds the only SDK instance,
  accepts messages from the extension's service worker only, and loads the SDK
  chunk on the first identify.
- UI documents have no Braze code.

## Lifecycle

`getDesiredBrazeUser` (`shared/lib/braze.ts`) decides the user:

| State                                                         | Result                             |
| ------------------------------------------------------------- | ---------------------------------- |
| Onboarding incomplete, Basic Functionality off, or signed out | Clear (`wipeData`, then `destroy`) |
| Unlocked, signed in, with a canonical profile ID              | Identify                           |
| Locked, or the profile ID is not available yet                | No change                          |

- Basic Functionality defaults to on during onboarding; waiting for onboarding
  completion means the user's choice has been applied before Braze runs.
- `changeUser` runs only when the ID differs. A changed ID starts a session;
  re-identifying the same user sends nothing.
- Clearing wipes local data before destroying the SDK, because `destroy`
  flushes queued data. If an earlier offscreen document left Braze data in
  `localStorage`, the host initializes the SDK only to wipe it; this sends no
  requests. With no Braze data, clearing does not load the SDK.
- Lock never clears data.
- The offscreen document is recreated when the service worker restarts. The
  service re-syncs on startup and the SDK reuses its persisted user without
  starting a new session.
- The SDK is not suspended when the UI closes. After identification it only
  runs a flush timer that sends nothing while its queue is empty.
- Builds without `BRAZE_WEB_API_KEY` and `BRAZE_SDK_ENDPOINT`, and test builds,
  register neither the service nor the offscreen listener.

Offscreen documents only expose part of `chrome.runtime` (for example,
`getManifest` is not available), so the host identifies the background by the
message sender's fields rather than by the manifest.

## LavaMoat policy

Braze is only bundled in MV3 builds, so only `lavamoat/webpack/mv3/*/policy.json`
and `policy-override.json` reference it. The overrides deny capabilities Braze
does not need for identity: push and Safari notifications, the real-time
`EventSource`, Braze-hosted UI helpers, `open`, and action decoding. `crypto` is
narrowed to `getRandomValues` and `location` to `location.href`. `localStorage`
stays granted so the identity survives offscreen document restarts.
`indexedDB` is not granted.
