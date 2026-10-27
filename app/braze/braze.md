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
    page is a DOM context.
- `braze-service-init.ts` selects the adapter at runtime with `isManifestV3`.
  The host is part of the shared background module graph, but its SDK chunk is
  loaded lazily and only on MV2; MV3 selects the offscreen client instead.
- UI documents have no Braze code.

## Lifecycle

`getDesiredBrazeUser` (`shared/lib/braze.ts`) decides the user:

| State                                                                       | Result                             |
| --------------------------------------------------------------------------- | ---------------------------------- |
| Onboarding incomplete, Basic Functionality off, or signed out               | Clear (`wipeData`, then `destroy`) |
| Unlocked, signed in, canonical profile ID available, and a UI document open | Identify                           |
| Locked, profile ID not available yet, or no UI document open                | No change                          |

- Basic Functionality defaults to on during onboarding; waiting for onboarding
  completion means the user's choice has been applied before Braze runs.
- `changeUser` runs only when the ID differs. A changed ID starts a session;
  re-identifying the same user sends nothing.
- Clearing wipes local data before destroying the SDK, because `destroy`
  flushes queued data. A host that never loaded the SDK does not load it to
  clear: with no storage grant it holds no data.
- Lock never clears data.
- **Identifying waits for an open UI document.** `changeUser` opens a Braze
  session and the SDK cannot end one early, so the service also reads
  `ClientController.isUiOpen`, which the background maintains from the UI ports
  (popup, expanded tab, side panel, notification). A background-only wakeup
  therefore loads no SDK, sends no request, and starts no session. Opening a
  document flips `isUiOpen` and identifies; closing the last document only
  stops new sessions from being started — the current one expires on Braze's
  side after `sessionTimeoutInSeconds` (30 minutes by default) and the
  offscreen document keeps flushing queued events, so nothing is lost.
- Reopening inside that window keeps the same session (`changeUser` is a no-op
  for the same ID). Reopening after it expired starts a new session on the next
  flush, because `requestImmediateDataFlush` re-evaluates the session.
- `ClientController.isUiOpen` is derived from the UI ports and is not persisted,
  so a service worker restart while a document stays open leaves it `false`
  until that document reconnects or is reopened. The service then stays idle,
  which fails safe (no session) but also means no identity until the next open.
  A UI-driven Braze call (fetching banners, for example) is the natural place
  to re-sync if that ever needs to be tightened.
- The host is recreated when the service worker restarts (MV3) or the
  background page reloads (MV2). On MV3 `createOffscreen` closes and recreates
  an existing offscreen document on every service worker boot, so the host is
  recreated on every boot, not only on browser restart. The service re-syncs on
  startup; Braze keeps its state in memory only, so a boot with a UI document
  open identifies again and starts a new session. Until the offscreen document
  survives the service worker, expect one session start per boot with a UI
  document open (see "Storage").
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

## Storage

Braze is not granted `localStorage` or `indexedDB`, and cookie-based storage is
disabled with `noCookies: true`, so the SDK falls back to an in-memory store.
No Braze state is persisted in the extension's storage, and `wipeData` only
clears the in-process instance.

What the SDK keeps in memory is lost when the host is recreated: the device ID,
the session, queued events, the server config, the banner cache, impression
dedupe state, and pending dismissals. Identity is re-applied from the background
on startup, so no user data outlives the clear path. The cost is traffic and
reporting: a new session start, a new anonymous device ID, and a `/data/` fetch
per host, plus a `/banners/sync` before the banner cache is warm again.

If those costs matter, the fixes are, in order:

1. Keep the offscreen document (and therefore the SDK instance) alive across
   service worker restarts. That restores session continuity, keeps the device
   ID and the banner cache, and reduces the cost to one host per browser
   session. It is an offscreen-lifecycle change, owned by core-platform.
2. Cache banners in extension state and render from that cache while the SDK
   refreshes in the background. This also makes the carousel independent of the
   SDK's lifecycle and keeps request frequency under our control.
3. Back the SDK's store with extension storage by replacing its internal
   in-memory adapter (`StorageManager.rg`). It gives full persistence, but the
   hook is a minified static that only exists in 7.0.0 and the adapter interface
   is synchronous, so we would own serialization, quota, and migrations. Not
   worth it unless the first two options fail.

The one write that does reach the extension origin is the SDK's own opt-out
probe: `initialize` constructs the cookie store before `noCookies` is applied,
which writes and clears `ab._gd` and reads `ab.optOut`. Those cookies belong to
Braze's namespace and are not part of the wallet's state.

## LavaMoat policy

Braze is bundled in the MV3 offscreen entry and the MV2 background entry, so
`lavamoat/webpack/mv3/*` and `lavamoat/webpack/mv2/*` reference it in both
`policy.json` and `policy-override.json`. The overrides deny what Braze does not
need for identity and banners:

- push and Safari notifications (`Notification`, `ServiceWorkerRegistration`,
  `safari`, `btoa`), the real-time `EventSource`, and `open`
- action and trigger decoding (`atob`)
- Braze-hosted HTML rendering (`innerHeight`, `innerWidth`, `orientation`,
  `screen.mozOrientation`, `screen.msOrientation`)
- any persistent storage (`localStorage`; `indexedDB` is not granted)
- device resolution (`screen.width`, `screen.height`), which the host opts out
  of with `devicePropertyAllowlist`

`crypto` is narrowed to `getRandomValues`, `Intl` to `DateTimeFormat`, and
`window.location` to `location.href`, so `_openUri` (Braze-hosted link clicks)
cannot navigate.

`document` and `navigator` stay whole. `initialize` needs
`document.createElement` and `document.location.hostname`, the opt-out probe
needs `document.cookie`, every flush reads `document.hidden`, and `changeUser`
calls `document.querySelectorAll`/`getElementById`/`getElementsByClassName` to
remove its own in-app message nodes. The `querySelectorAll` grant already
reaches the whole document, so narrowing its siblings would not reduce what the
SDK can read. It also means `document.location` (including `assign`) and
`document.cookie` stay reachable, which is why the `location` narrowing above
only removes the `window.location` write. `navigator` is read at module load by
the browser detector (`userAgent`, `userAgentData`, `platform`, `language`) and
during `initialize` (`cookieEnabled`), and it is a read-only grant; its
remaining members add no capability the granted `XMLHttpRequest` does not
already provide.

`development/webpack/test/lavamoat.braze.test.ts` pins the granted set for all
eight build variants, so a regenerated policy that adds a grant fails the test
instead of landing silently.
