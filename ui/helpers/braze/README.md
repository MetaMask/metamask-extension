# Braze identity

This UI-only adapter identifies Braze with the primary SRP's Profile Sync
canonical profile ID. `MetamaskIdentityProvider` calls `useBrazeIdentity` once
per UI document.

## Lifecycle

- Import the bundled SDK normally. Initialization waits for completed onboarding
  and an unlocked, signed-in wallet with basic functionality enabled and a
  canonical profile ID. Basic Functionality defaults to enabled during onboarding;
  completion confirms the user has had a chance to disable it and their choice
  has been applied. Braze must not initialize or send requests before then.
- `BRAZE_WEB_API_KEY` and `BRAZE_SDK_ENDPOINT` must be configured. Test builds
  and builds without these values do not initialize Braze.
- SDK lifecycle methods are synchronous. The SDK's `isInitialized()` and
  `getUser()` are the source of truth; no operation queue, pending-call cache,
  or React identity latch is needed.
- Sign-out and basic-functionality opt-out wipe local data **before** destroying
  the SDK, because destruction attempts a final flush. Lock does not wipe data.
- Each UI document has its own SDK instance. Braze manages its shared browser
  storage; a document that has never initialized does not activate Braze just to
  clean up persisted data.

Static named imports favor a small adapter and tree shaking over loading the SDK
asynchronously. This puts SDK parsing/evaluation on the UI load path, but avoids
turning synchronous identity operations into a second asynchronous lifecycle.
Revisit code splitting only with measured startup evidence.

## LavaMoat policy

`@braze/web-sdk` is restricted in each build's `policy-override.json`. The
denied globals belong to SDK features this integration does not enable: push
and Safari notifications, the real-time messaging `EventSource`, Braze-hosted
in-app message/chat viewport helpers, action-link decoding, and `window.open`.
`document`, `navigator`, and `localStorage` stay whole-object grants because the
SDK initializes its base URL, cookie/local storage, and device metadata before
any feature can be gated, and the current LavaMoat runtime does not support
re-allowing several members of a denied parent. Add a capability to the
override only together with the feature that needs it; `policy.json` is
generated and re-adds the full set on the next `yarn lavamoat:auto`.

## Following integrations

`changeUser` **starts a session when the ID changes**, even without an explicit
`openSession()` call. The real-SDK lifecycle test covers this. The banner
integration should choose when to open additional sessions on subsequent UI
visits and when to refresh placements.

Keep SDK imports in the UI: the SDK requires a DOM and cannot run in the MV3
background service worker. Push token maintenance is disabled. Automatic in-app
message rendering is not enabled; banner/message presentation belongs to the
corresponding feature integration.
