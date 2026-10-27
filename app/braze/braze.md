# Braze identity

Braze identifies users with the primary SRP's Profile Sync canonical profile
ID, the same `external_id` Mobile uses. The SDK runs once per extension: in the
MV3 offscreen document, or in the MV2 background page (Firefox), which is a DOM
context.

## Ownership

- `BrazeService` (`app/scripts/services/braze-service.ts`, background) owns the
  gates. It listens to `OnboardingController`, `PreferencesController`
  (`useExternalServices`), `AuthenticationController`, and `KeyringController`,
  and applies the desired user when it changes.
- The host (`app/braze/braze-host.ts`) holds the only SDK instance and loads
  the SDK chunk on the first identify. The platform only chooses how the
  background reaches it:
  - MV3: `app/offscreen/braze.ts` runs the host in the offscreen document,
    with `app/offscreen/braze-client.ts` sending `syncUser` messages from the
    extension's service worker only.
  - MV2: `BrazeServiceInit` calls the host directly, because the background
    page has DOM storage.
- `braze-service-init.ts` selects the adapter at runtime with `isManifestV3`.
  The host is part of the shared background module graph, but its SDK chunk is
  loaded lazily and only on MV2; MV3 selects the offscreen client instead.
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
  flushes queued data. If an earlier host left Braze data in `localStorage`,
  the host initializes the SDK only to wipe it; this sends no requests. With no
  Braze data, clearing does not load the SDK.
- Lock never clears data.
- The host is recreated when the service worker restarts (MV3) or the
  background page reloads (MV2). The service re-syncs on startup and the SDK
  reuses its persisted user without starting a new session.
- Braze defers its periodic flush while the document is hidden. The MV2
  background page can be hidden, so the host calls
  `requestImmediateDataFlush` after applying an identified user. This is a
  no-op when the queue is empty.
- The SDK is not suspended when the UI closes. After identification it only
  runs a flush timer that sends nothing while its queue is empty.
- Builds without `BRAZE_WEB_API_KEY` and `BRAZE_SDK_ENDPOINT`, and test builds,
  register neither the service nor the host.

Offscreen documents only expose part of `chrome.runtime` (for example,
`getManifest` is not available), so the MV3 listener identifies the background
by the message sender's fields rather than by the manifest.

## LavaMoat policy

Braze is bundled in the MV3 offscreen entry and the MV2 background entry, so
`lavamoat/webpack/mv3/*` and `lavamoat/webpack/mv2/*` reference it in both
`policy.json` and `policy-override.json`. The overrides deny capabilities Braze
does not need for identity: push and Safari notifications, the real-time
`EventSource`, Braze-hosted UI helpers, `open`, and action decoding. `crypto` is
narrowed to `getRandomValues` and `location` to `location.href`. `localStorage`
stays granted so the identity survives host restarts. `indexedDB` is not
granted.
