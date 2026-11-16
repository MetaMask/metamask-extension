# Braze identity

Braze identifies users with the primary SRP's Profile Sync canonical profile
ID, the same `external_id` Mobile uses. The SDK runs once per extension, inside
a dedicated worker. The MV3 offscreen document or MV2 background page owns the worker; neither page evaluates the SDK.

## Ownership

- `BrazeService` (`app/scripts/services/braze-service.ts`, background) owns the
  gates. It listens to `OnboardingController`, `PreferencesController`
  (`useExternalServices`), `AuthenticationController`, and `KeyringController`,
  and applies the desired user when it changes.
- The host (`app/braze/braze-host.ts`) starts the dedicated worker on the first
  identify and sends only profile IDs. The worker installs its compatibility
  environment before loading `braze-sdk-host.ts` and the SDK. The platform only
  chooses how the background reaches it:
  - MV3: `app/offscreen/braze.ts` runs the host in the offscreen document,
    with `app/offscreen/braze-client.ts` sending `syncUser` messages from the
    extension's service worker only.
  - MV2: `BrazeServiceInit` calls the worker host directly in the background
    page.
- `braze-service-init.ts` selects the adapter at runtime with `isManifestV3`.
  The host contains no SDK code. On MV3 the offscreen client reaches the worker
  host; on MV2 the background calls it directly. Configured MV3 builds also
  declare the offscreen document's `WORKERS` reason.
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
  clear: with no worker it holds no data. Clearing an active worker waits for
  the SDK acknowledgement before terminating it.
- Lock never clears data.
- **Identifying waits for an open UI document.** `changeUser` opens a Braze
  session and the SDK cannot end one early, so the service also reads
  `ClientController.isUiOpen`, which the background maintains from the UI ports
  (popup, expanded tab, side panel, notification). A background-only wakeup
  therefore loads no SDK, sends no request, and starts no session. Opening a
  document flips `isUiOpen` and identifies; closing the last document only
  stops new sessions from being started — the current one expires on Braze's
  side after `sessionTimeoutInSeconds` (30 minutes by default) and the
  worker keeps flushing queued events, so nothing is lost.
- Reopening inside that window keeps the same session (`changeUser` is a no-op
  for the same ID). Reopening after it expired starts a new session on the next
  flush, because `requestImmediateDataFlush` re-evaluates the session.
- `ClientController.isUiOpen` is derived from the UI ports and is not persisted,
  so a service worker restart while a document stays open leaves it `false`
  until that document reconnects or is reopened. The service then stays idle,
  which fails safe (no session) but also means no identity until the next open.
  A UI-driven Braze call (fetching banners, for example) is the natural place
  to re-sync if that ever needs to be tightened.
- The worker is recreated when the service worker restarts (MV3) or the
  background page reloads (MV2). On MV3 `createOffscreen` closes and recreates
  an existing offscreen document on every service worker boot, so the host is
  recreated on every boot, not only on browser restart. The service re-syncs on
  startup; Braze keeps its state in memory only, so a boot with a UI document
  open identifies again and starts a new session. Until the offscreen document
  survives the service worker, expect one session start per boot with a UI
  document open (see "Storage").
- The worker facade reports `document.hidden: false`, so the SDK continues to
  flush regardless of the owning page's visibility. The SDK host also calls
  `requestImmediateDataFlush` after applying an identified user.
- The SDK is not suspended when the UI closes. After identification it only
  runs a flush timer that sends nothing while its queue is empty.
- Builds without `BRAZE_WEB_API_KEY` and `BRAZE_SDK_ENDPOINT`, and test builds,
  register neither the service nor the host.

Offscreen documents only expose part of `chrome.runtime` (for example,
`getManifest` is not available), so the MV3 listener identifies the background
by the message sender's fields rather than by the manifest.

## Storage

The SDK receives no persistent storage. Both `indexedDB` and `localStorage` are
unavailable, and `noCookies: true` keeps normal cookie storage disabled. The
facade discards the cookie probes that SDK initialization still performs.
Nothing reads or writes the extension's real cookie jar.

Device IDs, sessions, queued events, and server configuration live only in the
worker. They disappear on clear, worker termination, offscreen recreation, or
background reload. Identity is re-applied from background state after restart.
This retains the existing cost of a new device/session on host recreation.

## Security boundary

The invariant is that SDK code has no live DOM objects and no page operation
broker. It is enforced independently of the SDK version and of tree shaking.

1. **Dedicated worker.** Web workers have no browsing context or page DOM. A
   future SDK can request another API, but it cannot obtain a page's document
   through the worker's events or network responses. In particular, worker XHR
   cannot return a document through `responseXML`.
2. **Worker-only build.** `brazeWorkerIsolationPlugin` rejects every emitted
   `@braze/web-sdk` module whose runtime is not exclusively `braze-worker`.
   This check runs in development too, without LavaMoat. The worker entry is
   emitted only when both Braze configuration values are present. It uses a
   stable packaged filename and its own `importScripts` chunk loader.
3. **Runtime check.** `installBrazeWorkerEnvironment` refuses to run in a page
   or in a context without `importScripts`. It runs before the dynamic SDK
   import, so SDK module initialization also sees the restricted environment.
4. **Compatibility facade.** `createBrazeDocument` provides only URL parsing,
   empty message cleanup queries, a visible state, and discarded cookie writes.
   Its anchor is a frozen plain object with `href`, `pathname`, and `toString`.
   It has no `ownerDocument`, `defaultView`, native element prototype, or DOM
   insertion methods. Creating any tag other than `a`, including `script` and
   `iframe`, throws. No facade operation accesses a real document.
5. **No privileged worker globals.** The environment supplies scalar snapshots
   of navigator and location, fixed screen dimensions, and denies extension
   APIs, nested workers, persistent storage, notifications, and EventSource.
   These restrictions also run in development without LavaMoat.
6. **Acknowledgements only.** The document host sends `{ id, profileId }` and
   accepts only `{ id, success, error? }`. It never renders worker data, follows
   worker URLs, evaluates worker strings, or handles DOM commands. Structured
   cloning cannot transmit a live DOM node or a function. Worker startup errors,
   message failures, and a 30-second timeout terminate it and reject pending
   requests; a later request can retry.

The current host identity API and initialization options remain unchanged.
SDK-rendered HTML messages, banners, and JavaScript actions are intentionally
unsupported. Future messaging should expose structured data for MetaMask-owned
rendering, with a separate review of the data and action contract.

The guarantee assumes the browser's worker isolation and the checked-in
boundary remain intact. It is not a guarantee against browser vulnerabilities
or future application changes that deliberately add a rendering or execution
broker. An incompatible SDK upgrade must fail rather than receive a real DOM.

## LavaMoat and CSP

Both platform policies apply to the SDK **inside its worker**. The `document`
and `navigator` grants now refer to the installed compatibility objects, not to
native page objects. Whole-document grants in a page would not be safe: even a
single native `createElement` or selector can return an element that exposes its
`ownerDocument`.

Overrides explicitly deny DOM constructors, extension APIs, nested workers,
notifications, EventSource, action decoding, navigation, and persistent storage.
The capability test checks all eight variants and requires an explicit update
for any new permitted global. The worker has its own LavaMoat lockdown and
scuttling, without Snow, and preserves `importScripts` only for webpack's
packaged chunk loader. The extension CSP still disallows remote JavaScript and
string evaluation.

Named identity imports continue to keep unused SDK rendering code out of
optimized production chunks. This reduces the bundle size; it is no longer the
security boundary. Development bundles may contain those renderers and still
cannot operate on a page DOM.

## Verification

- Colocated facade tests cover rejected tags, absence of node traversal,
  immutable objects, endpoint parsing, empty queries, and discarded cookies.
- Host tests cover acknowledgement validation, ignored HTML messages, clear
  termination, concurrent updates, worker failures, retry, and timeout.
- Existing real-SDK lifecycle tests cover identity, sessions, flush, and clear.
- `development/webpack/test/lavamoat.braze.test.ts` compiles the real SDK and
  rejects direct page imports, shared page/worker imports, and SDK code
  concatenated into application modules.
- Browser verification must also exercise the compiled worker with the real
  SDK under production LavaMoat and development settings. Mock network I/O at
  the worker boundary and verify identity, repeat identity, clear, rejected
  script/iframe creation, and absence of document/window traversal.
