# Plan: Port mobile Sentry performance traces to Extension

Sources:

- [metamask-mobile#35010](https://github.com/MetaMask/metamask-mobile/pull/35010) — Deeplink Processed / Navigated (+ signature-verify and intent-prepare children)
- [metamask-mobile#35134](https://github.com/MetaMask/metamask-mobile/pull/35134) — Notification List Time To Content, Braze Banner Time To Content

Goal of this document: a porting plan only. No instrumentation yet.

Shared helper on both clients: `trace()` / `endTrace()` (extension: `shared/lib/trace.ts`). New names go on `TraceName` / `TraceOperation`. Product analytics (`DeepLinkUsed`) stay separate.

---

## 1. What mobile shipped (field inventory)

### 1.1 Deeplink Processed (`op: deeplink.performance`)

Measures **app-side work**, not human wait.

| When | Field | Values |
| --- | --- | --- |
| Start tags | `deeplink_route` | path/host action (`home`, `trending`, …); `unknown` if unparseable |
| Start tags | `deeplink_variant` | `screen` or `tab` query, else `default` (regex `^[a-z][a-z-]{0,23}$`) |
| Start tags | `signed` | `true` if URL has `sig` |
| Start tags | `start_source` | `parse` \| `resolve` (different enum from Navigated) |
| Start tags | `app_start_type` | `cold` \| `warm` (JS **process**, not locked vs unlocked) |
| Start tags (after-gate only) | `segment`, `interstitial` | `after_gate`, `shown` |
| End data | `success` | `true` / `false` |
| End data | `seam` | `pre_navigate` (intent handlers) \| `handler_finished` (legacy, includes their `navigate()`) |
| End data | `segment` | `full` \| `before_gate` \| `after_gate` |
| End data | `interstitial` | `shown` \| `skipped` |
| End data | `target_route` | intent route when known |
| Cancel data | `reason` | `rejected` \| `unresolved` \| `error` |

Children (only while a Processed parent is open, skipped during interstitial dwell):

`before_gate` success has no `seam`; cancellation omits `seam` and
`interstitial`; `target_route` is optional.

- **Deeplink Signature Verify** — `verifyDeeplinkSignature`, only for a signed
  URL on a supported mobile universal-link domain
- **Deeplink Intent Prepare** — `intent.prepare()`

`forceTransaction: true` is set on the Processed and Navigated parent
transactions so a still-open **UI Startup** does not swallow them. The two
children use `parentContext` and do not set `forceTransaction`.

Rejecting the mobile interstitial does not emit a failed Processed
transaction: `before_gate` has already ended successfully. It cancels
Navigated with `reason: interstitial_rejected`.

### 1.2 Deeplink Navigated (`op: deeplink.performance`)

Measures **active intake/unlock start → navigation state commit** (not first
paint). It can include interstitial dwell, and inferred flows can close on the
first qualifying commit rather than the eventual destination.

| When | Field | Values |
| --- | --- | --- |
| Start tags | same URL tags as Processed | `deeplink_route`, `deeplink_variant`, `signed` |
| Start tags | `start_source` | `unlock` \| `intake` |
| Start tags | `app_start_type` | `cold` \| `warm` |
| End data | `success` | `true` / `false` |
| End data | `nav_target` | `known` (declared target in focused chain, including Home's legacy target) \| `inferred` (first commit after Processed closed) |
| End data | `target_route` | declared known target, including Home's legacy `Wallet` target |
| End data | `focused_route` | leaf route at close |
| End data | `already_focused` | present as `true` only for an already-focused known target; absent otherwise |
| Cancel data | `reason` | `rejected` \| `unresolved` \| `error` \| `interstitial_rejected` \| `unlock_failed` \| `metrics_opt_in` |

Skipped for unparseable links; protocols `wc:` / `ethereum:`; actions `wc` /
`bind` / `connect` / `mmsdk`; and upstream duplicate-delivery or MWP
short-circuits.

Gated Navigated **includes interstitial dwell**. App-only time for those links is Processed `before_gate` + `after_gate`. Password time is excluded by starting at unlock **submit**.

Mobile's inferred path can close on the first commit after Processed ends
(including a modal-dismissal commit before the eventual destination). Known
targets wait for the focused route chain. After five minutes, mobile marks the
trace timed out and drops the transaction rather than emitting a domain
cancellation reason.

### 1.3 Notification List Time To Content (`op: notification.performance`)

Hook `useNotificationListPerformance`. UUID `id` per enabled effect activation.

| Field | Values |
| --- | --- |
| `success` | `true` on mobile's first observed `isLoading: false` (including initial false); `false` on unresolved unmount/disable |
| `source` | `warm` = this enabled hook activation did not observe `isLoading: true`; `cold` = it observed loading before settlement. This is a heuristic, not proof of cache versus fetch. |
| `notification_count` | Mobile's deduplicated, sorted `allNotifications` length passed to its rendered list |
| `content_state` | `filled` \| `empty` |
| `reason` | `unmounted` on cancel |

Disabled notifications: hook not started. The UUID is per enabled effect
activation (disable/re-enable can create another trace), not strictly per
component mount. No process-level `app_start_type`.

### 1.4 Braze Banner Time To Content (`op: braze_banner.performance`)

Start tag: `placement_id`. End data:

| Field | Values |
| --- | --- |
| `success` | `true` banner accepted; `false` otherwise |
| `source` | `warm-cache` (SDK already had a card) \| `event` (listener), on accepted or explicit-empty outcomes only |
| `banner_name` | campaign name when present |
| `placement_id` | repeated on end |
| `reason` | `empty` (control / mismatch) \| `timeout` (`SKELETON_TIMEOUT_MS`) \| `unmounted`; no explicit mobile `error` outcome |

Idempotent `endBrazeTrace` so timeout / accept / unmount cannot double-end.

---

## 2. Cold vs warm on Extension (do not copy `app_start_type` as-is)

Mobile `app_start_type` is **one JS process**: it remains `cold` until the
first login interaction in that process completes, then becomes `warm`
(including later lock/unlock cycles). Unlock vs locked is a **different** axis
(`start_source`).

Extension has **three** clocks that mobile collapses into one:

| Layer | What “cold” would mean | Typical deeplink |
| --- | --- | --- |
| MV3 service worker | SW was dead and woke for `webRequest` | Common after idle |
| UI document | Every `home.html` load is a new JS realm; `UI Startup` already starts at `performance.timeOrigin` (`app/scripts/ui.js`) | **Always a new document** for intercepted links: `tabs.update` loads the extension page (interstitial or destination) |
| Wallet lock | `RequireAuthenticated` redirects to `/unlock` and restores `location.state.from` | Orthogonal to SW/UI |

Consequences:

1. Tagging every extension deeplink `app_start_type: cold` because “the UI just started” makes the tag useless (almost every Navigated would be cold).
2. Tagging `warm` because “the wallet was already unlocked” **collides** with mobile’s meaning and with `start_source: intake`.
3. Popup vs tab: intercepted links run in the **browser tab** that hit `link.metamask.io`, not the toolbar popup. Popup open/close is irrelevant for these traces.
4. In-extension hash navigations (rare for this pipeline) are the only “warm UI” case.

**Recommendation:** do **not** emit mobile’s `app_start_type` until we can define it. Prefer one explicit tag:

- `sw_alive`: `true` if the worker had already been running (e.g. time since SW `performance.timeOrigin` above a small threshold, or a module-level “first request in this worker lifetime” flag).

Keep lock vs unlocked on `start_source` only (`unlock` vs `intake`), matching mobile.

`forceTransaction`: extension `TraceRequest` does not expose this option. The
helper already creates a root transaction when no parent is active and
internally sets `forceTransaction` when it finds an auto-instrumented parent
(pageload / **UI Startup**), so the port needs no API change here. Background
Processed normally has no UI Startup parent; the behavior is important for
UI-side Navigated in a fresh `home.html`.

**Do not port** mobile `unlockTraces` / **Homepage Ready**. Extension already has **UI Startup** + **Background Connect** + **Load Scripts**. Coupling Homepage Ready to Navigated is a mobile startup-saga concern.

Notification/banner source is unrelated to process start. Notification
`cold | warm` is the hook's observed-loading heuristic; banner
`warm-cache | event` is the SDK source. Preserve those meanings rather than
reusing `app_start_type`.

---

## 3. Deeplink handling: mobile vs extension (why the clocks move)

### 3.1 Mobile pipeline (single process, in-memory singleton)

`handleDeeplink` → pending URL if locked → after unlock, saga `parse` (today; `resolve`/`intent` is unused) → optional universal-link **modal** in the same React tree → `navigate` / `navigation.reset` → `NavigationProvider.onStateChange` closes Navigated.

Module `DeeplinkPerformance.ts` holds Processed + Navigated. Interstitial is a modal: JS stays alive, spans pause around dwell (`before_gate` / hole / `after_gate`).

### 3.2 Extension pipeline (two Sentry clients, multiple documents)

```
Browser tab → link.metamask.io
    → DeepLinkRouter.tryNavigateTo (background)
        → parse() + verify()          // first parse
        → shouldShowDeepLinkInterstitial()  // SECURITY BOUNDARY — do not relax
        → tabs.update(interstitial | destination | 404)
    → NEW UI document (home.html)
        → if /deep-link?u=… : DeepLink.tsx parse() AGAIN, Continue is <a href>
        → NEW UI document (destination) OR same document if skipped interstitial
        → RequireAuthenticated: if locked, <Navigate to /unlock state.from>
        → unlock submit → getRedirectAfterUnlock → destination route
```

Relevant facts:

| | Mobile | Extension |
| --- | --- | --- |
| Intake | Native `handleDeeplink` | Background `webRequest.onBeforeRequest` (`DeepLinkRouter`) |
| Parse | `DeeplinkManager.parse` / unused `resolve` | `shared/lib/deep-links/parse.ts` — **background first**; **UI again** on interstitial |
| Handlers | `intent/` (`prepare()` + `routeName`) vs `legacy/` (navigate inside parse) | Sync `Route.handler(searchParams)` → `{ path, query }` or `{ redirectTo }` — **no `prepare()`, no React Navigation** |
| Interstitial | Modal over the app; `DEEP_LINK_ROUTE` analog is in-app | Full page at `DEEP_LINK_ROUTE`, **outside** `RequireAuthenticated` (`routes.component.tsx`). Continue is a **full navigation** (`Button href={route.href}`), not `history.push` |
| Locked | Pending URL; Navigated starts at unlock submit; Processed after unlock | Interstitial **can show while locked**. Continue then hits a destination that **is** behind `RequireAuthenticated`, which then sends the user to unlock |
| Nav commit | `onStateChange` focused route chain | React Router location / `RequireAuthenticated` render of destination |
| Never-navigate | WC / ethereum / mmsdk | `redirectTo` off-extension destinations (already excluded from `DeepLinkUsed` via `shouldTrackDeepLinkNavigation`) |
| Analytics | `DEEP_LINK_USED` | `DeepLinkUsed` on router `navigate` in `background.js` |
| Metrics opt-in detour | Cancels Navigated (`metrics_opt_in`) | No direct equivalent. Some destinations can redirect through `/basic-functionality-off`; cancel that extension-specific opt-in detour rather than record a false success. |

Security: this work must **not** change `shouldShowDeepLinkInterstitial` or when the interstitial is shown. Traces wrap existing branches only.

### 3.3 Why an in-memory singleton like mobile’s will not work

1. **Background and UI are separate Sentry SDKs.** A span started in the service worker cannot be `endTrace`d in the UI. `SerializedTraceContext` / `continueTrace` exists for **UI → background RPC**, not SW → next `home.html`.
2. **Continue destroys the interstitial document.** A mobile-style
   `after_gate` or Navigated span cannot live only in `DeepLink.tsx` RAM.
3. **MV3 can kill the SW** between interstitial paint and Continue. In-memory Processed state in the router is gone unless persisted.
4. **`parse` is duplicated.** A single Processed from “first parse to pre-navigate” is either background-only (misses UI re-parse) or must be two segments in two processes.

### 3.4 Recommended seam mapping (extension)

Keep the **same TraceName strings** so Discover queries can be shared, but change **where clocks start/stop**.

**Deeplink Processed** — two allowed shapes:

| Segment | Process | Start | End |
| --- | --- | --- | --- |
| `full` (interstitial skipped) | Background | `tryNavigateTo` before `parse` | immediately before `redirectTab` to destination (`seam: pre_navigate`) |
| `before_gate` | Background | same | immediately before `redirectTab` to `/deep-link?u=…` |
Extension has no honest `after_gate` Processed segment. `DeepLink.tsx` performs
its second `parse` and computes the destination **before** showing an enabled
Continue CTA; after Continue, the browser only loads the already-computed href.
Labeling the UI re-parse `after_gate` would misclassify pre-gate work, while
emitting a near-zero span on click would not measure processing. Leave
`after_gate` absent in v1 and document this client difference in dashboards.

Do **not** include Continue-to-destination document load in Processed; that is
Navigated (and UI Startup). The interstitial UI re-parse is not included in v1
Processed; measuring interstitial readiness can be a separate follow-up trace.

Child **Deeplink Signature Verify**: wrap `verify()` inside `parse.ts` only
when the external URL has a `sig` parameter and a Processed parent, matching
mobile's signed-link child. Pass that parent from the background router. The
interstitial UI's duplicate parse has no Processed parent in v1, so its child
is skipped.

**Deeplink Intent Prepare:** **do not port.** There is no async `prepare()`. If a route later grows async work before `redirectTab`, add a child then.

**Deeplink Navigated** — persist a small record keyed by browser tab ID so a
**new UI document** can start the span with a `startTime` override. Use
`browser.storage.session` on Chromium MV3 and a TTL-protected
`browser.storage.local` fallback on Firefox/MV2, where `storage.session` is not
available. Store only low-cardinality URL tags and a stable route identifier,
never the raw public URL, concrete internal path, or arbitrary query
parameters. Internal paths can contain asset IDs or market symbols. The tab ID
is already available at intake and remains stable across `tabs.update`,
including the interstitial. Remove records on `tabs.onRemoved` and sweep
expired fallback records when the router installs so `storage.local` does not
accumulate telemetry state:

| Situation | `start_source` | Start timestamp | End |
| --- | --- | --- | --- |
| Interstitial skipped, already unlocked | `intake` | original background intake | first unlocked destination route commit in UI |
| Interstitial skipped, locked | `unlock` | unlock **submit** (password / passkey), not unlock page paint | same |
| Interstitial shown, then Continue, already unlocked | `intake` | original background intake (includes interstitial dwell, matching mobile) | destination document route commit |
| Interstitial shown, then Continue, locked | `unlock` | unlock submit on the **destination** document | route commit after `getRedirectAfterUnlock` |
| `redirectTo` / 404 / parse `false` | — | do not start Navigated | Processed cancel `rejected` / `error` |

Pass `target_route` as the stable public route identifier
(`parsed.route.pathname`), not `destination.path`: asset and perps destinations
can embed user-controlled IDs/symbols in the concrete path. Close on the first
unlocked, non-interstitial/non-unlock route commit and set
`nav_target: inferred`, because the persisted record deliberately does not
retain the concrete destination. Derive `focused_route` from the matching
low-cardinality `ROUTES` path template (or `unknown`), never the raw
`location.pathname`.

If routing lands on `/basic-functionality-off`, cancel Navigated with
`reason: basic_functionality` and remove the record. That page requires another
user opt-in and CTA before opening the blocked feature; treating it as the
destination is a false success, while keeping the original span open includes
unrelated consent dwell.

Do not close synchronously in the parent route observer. Schedule completion
for the next task and cancel it in effect cleanup if `location` changes. This
lets nested `<Navigate replace>` guards (authentication, onboarding, or basic
functionality) commit their detour before telemetry declares success.

`already_focused` is unlikely (new document). Skip unless we add in-app deeplink routing without reload.

**Interstitial reject:** Back / close tab: `before_gate` already succeeded and
Navigated never reaches a destination document, so no Navigated transaction is
submitted. Unlike mobile, Extension cannot derive rejection rate from
`count(before_gate) − count(after_gate)` because there is no honest
`after_gate` processing segment.

**Tokens:** keep mobile’s token-scoped cancel so a failed unlock cannot close a newer Navigated.

Extension's trace helper has no automatic cleanup for manual traces. Add a
five-minute Navigated timer that settles `success: false,
reason: timed_out`, removes only the matching stored record, and clears its
timer/state.

### 3.5 Tag mapping for extension Processed / Navigated

| Tag / attribute | Port? | Notes |
| --- | --- | --- |
| `deeplink_route` | Yes | First non-empty public URL path segment, then hostname, else `unknown` |
| `deeplink_variant` | Yes | Same `screen`/`tab` + regex |
| `signed` | Yes | Preserve mobile semantics: whether the public URL has a `sig` parameter. Do not change this to signature validity. |
| `start_source` (Processed) | Remap | `parse` for the background router. The interstitial UI re-parse is not instrumented in v1. **Do not emit `resolve`.** |
| `start_source` (Navigated) | Yes | `unlock` \| `intake` only |
| `app_start_type` | **No** (v1) | Replace with optional `sw_alive` if needed |
| `seam` | Yes, collapsed | Almost always `pre_navigate`. No `handler_finished` unless we measure `HomeDeepLinkActions` separately |
| `segment` / `interstitial` | Partial | Emit `full` or `before_gate`. Do not emit `after_gate` because Extension has no post-Continue processing stage. |
| `nav_target` / `focused_route` / `target_route` | Adapt | `inferred`; stable React Router template for focused route; public route identifier for target. Never dynamic path values. |
| `reason: metrics_opt_in` | No | No direct mobile-equivalent detour |
| `reason: unlock_failed` | Yes | Unlock page submit failure |
| `reason: basic_functionality` | Extension only | Cancel on the basic-functionality opt-in page |

---

## 4. Notification list — near-direct port

Mobile hook is view-local and does not depend on React Navigation or process start.

Extension wiring:

- Hook alongside `Notifications` (`ui/pages/notifications/notifications.tsx`) or extracted to `ui/hooks/metamask-notifications/useNotificationListPerformance.ts`.
- Inputs: a **trace-only** pending signal, `notificationCount` =
  **`filteredNotifications.length`** (same “what the user sees” rule), and
  `enabled` = notifications feature on (skip the disabled-empty UI).
- Extension success waits for `isPending === false`; an error ends immediately
  with `success: false, reason: error`.
- `source: warm | cold` preserves mobile's observed-list-loading heuristic:
  `cold` after a list fetch/enable loading render; `warm` when no such render
  was observed. Preference/expiry/deferred blockers can delay settlement
  without changing this source.
- Unmount cleanup with a **ref** for latest count (mobile follow-up fix).
- Unique `id` per enabled effect activation (`crypto.randomUUID()`).
- Add `TraceName.NotificationListTimeToContent` and `TraceOperation.NotificationPerformance`.

Caveats:

- The current context `isLoading` is **not sufficient** for this trace.
  `MetamaskNotificationsProvider` owns one `useListNotifications()` instance,
  while startup/enable/disable effects create separate instances; their
  loading state never reaches the context. Expose a separate trace lifecycle
  from the startup effect (pending synchronously when its existing
  prerequisites are met, plus failure), and combine it with the controller's
  fetching/updating selectors. Do **not** replace the context's UI
  `isLoading`: doing so would newly show a spinner and violate the
  observability-only scope.
- Wait for the page's asynchronous feature-announcement preference hydration
  and `deleteExpiredNotifications()` cleanup before settling, so the recorded
  count does not immediately drift after the trace ends.
- Filter/tabs: count the extension's **active tab** list. Mobile has no
  equivalent tab split, so this is the closest rendered-content adaptation.
- `useDeferredValue` can keep the rendered list one commit behind Redux after a
  fetch. Treat that deferred transition as still loading for TTC; otherwise the
  trace can close with `notification_count: 0` immediately before the fetched
  rows render.
- On list/startup failure, end with `success: false, reason: error` rather than
  reporting warm empty content.
- Existing unused `TraceName.NotificationDisplay` is unrelated; do not reuse the name.

---

## 5. Home banner — do not copy Braze literally

There is **no Braze SDK** on extension. The home promotional surface is the **Contentful carousel** (`useCarouselManagement` + `ui/components/multichain/account-overview/carousel.tsx`).

Port the **questions**, not the SDK:

| Mobile Braze field | Extension analog |
| --- | --- |
| TraceName `Braze Banner Time To Content` | Prefer **`Home Banner Time To Content`** (or `Carousel Time To Content`) so Sentry is not lying. Same `op` family, e.g. `banner.performance` |
| `placement_id` | Constant e.g. `home_carousel` (no Braze placement) |
| `source: warm-cache` | The reported visible slide ID existed in persisted state before this fetch |
| `source: event` | The reported visible slide ID was introduced by the Contentful fetch |
| `banner_name` | Visible slide `id`, matching existing `BannerDisplay` metrics (`BannerSelect` separately uses `variableName ?? id`) |
| `reason: timeout` | **Do not port in v1.** Extension has no Contentful timeout today; adding one would change product behavior. |
| `reason: empty` | Successful fetch settled with zero renderer-visible slides |
| `reason: error` | Contentful fetch failed (extension addition; mobile Braze has no explicit error outcome) |
| `reason: unmounted` | Carousel unmount before settle |

`getAppIsLoading` is relevant here: `account-overview/carousel.tsx` passes it
as the carousel's `isLoading` prop, and the carousel renders skeleton cards
while it is true. Do not report content until the existing
`onActiveSlideChange` callback fires, which already requires a current visible
slide and `isLoading === false`. Start from the wrapper's layout effect so the
trace exists before the child's passive active-slide callback can report warm
content.

Start when the existing `carouselBanners` caller flag and
`contentfulCarouselEnabled` both resolve true, including a false/undefined →
true transition after mount. Do **not** wait for download-slide eligibility:
persisted slides can already render while lineage is resolving. The Contentful
fetch itself still follows its existing eligibility gate.
`getUseExternalServices` only participates in that eligibility flow;
instrumentation must not introduce a new product gate. If either carousel flag
is off, do not start a span.

Skeleton: the carousel renders skeleton cards while global app loading is true,
then renders nothing if no visible slides exist. Unlike Braze, it has no
carousel-specific skeleton timeout. Empty-after-fetch is the important failure
mode.

Visibility must match the renderer, not merely `mergedSlides`: the renderer
excludes dismissed slides and the Solana slide for a Solana data account, then
applies `MAX_SLIDES`. Extract and reuse that calculation. Settle success from
the existing `onActiveSlideChange(currentSlide)` callback. Record all persisted
slide IDs before the fetch to distinguish `warm-cache` from `event`, even if an
account-type filter initially hides one and an account switch reveals it.
Expose fetch `idle | loading | settled | error` state from
`useCarouselManagement`; never emit `empty` during `idle`/`loading`, and emit
it only when a successful fetch is settled and the shared calculation finds no
visible slide. The helper is for renderer/trace classification only; preserve
`CarouselWithEmptyState`'s existing dismissed-only folding behavior.

---

## 6. Suggested implementation slices

1. **Trace names + ops** in `shared/lib/trace.ts`; unit tests for any URL-tag helper (can live in `shared/lib/deep-links/` next to `parse.ts`).
2. **Deeplink Processed in background** (`DeepLinkRouter.tryNavigateTo`): start/end/`before_gate`/`full`, cancel on throw/unparseable; tests in `deep-link.router.test.ts`.
3. **Signature child** in `parse.ts`, parented by the background Processed trace.
4. **Session record + Navigated** in destination UI (route commit) and unlock submit; skip `redirectTo`.
5. **Notification list hook** + `notifications.tsx` + tests.
6. **Home banner TTC** in the account-overview carousel wrapper, with
   fetch-status support in `useCarouselManagement`, + tests.
7. Short query notes (can live in this file or a follow-up `docs/engagement/` page): which tags are start tags vs `endTrace` data (mobile’s Discover pitfall).

Do not change interstitial policy, `parse` verify rules, or deeplink routing for telemetry.

---

## 7. Testing

- Unit: URL tags, never-navigate/`redirectTo`, interstitial split (skip vs show), unlock vs intake start, token-scoped unlock fail, notification warm/cold/unmount/disabled, carousel warm/fetch/empty/unmount.
- No E2E required for “span appears in Sentry”; optional debug logs require a
  Sentry-enabled build plus existing metrics consent.
- Manual: unlocked skip-interstitial; locked skip-interstitial; interstitial
  Continue then unlock; trusted-origin skip; any `redirectTo` destination
  produces Processed only; basic-functionality detour cancels Navigated.

---

## 8. Out of scope / follow-ups

- Porting unused mobile `resolve` / intent `prepare` / `start_source: resolve`.
- Deferred/post-install deeplinks handled by `setDeferredDeepLink`,
  `getDeferredDeepLinkRoute`, and `useOnboardingCompletion`; they bypass
  `DeepLinkRouter` and require a separate in-app design.
- Homepage Ready / `unlockTraces`.
- `metrics_opt_in` Navigated cancel.
- Joining background Processed and UI Navigated into **one** distributed trace (possible later via `continueTrace` if we invent SW → UI propagation).
- Using `app_start_type` until `sw_alive` (or similar) is validated in real traffic.
- Changing how often the interstitial shows.
