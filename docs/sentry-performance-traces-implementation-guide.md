# Sentry performance traces: implementation guide

This guide turns
[`sentry-performance-traces-plan.md`](./sentry-performance-traces-plan.md) into
concrete implementation steps. It covers:

- **Deeplink Processed**
- **Deeplink Navigated**
- **Deeplink Signature Verify**
- **Notification List Time To Content**
- **Home Banner Time To Content**

Mobile references:

- [metamask-mobile#35010](https://github.com/MetaMask/metamask-mobile/pull/35010)
- [metamask-mobile#35134](https://github.com/MetaMask/metamask-mobile/pull/35134)

## Decisions fixed before implementation

1. Keep mobile trace names and field meanings where the products have equivalent
   behavior.
2. Do not emit `app_start_type` for extension deeplinks. Extension has separate
   service-worker, UI-document, and lock lifecycles, so mobile's process-level
   `cold | warm` field is not comparable.
3. Keep `signed` identical to mobile: it means the public URL contains a `sig`
   parameter. It does **not** mean verification succeeded.
4. An unlocked gated deeplink starts Navigated at original browser intake.
   Consequently, Navigated includes interstitial dwell, matching mobile.
5. A locked deeplink starts Navigated at password/passkey submit. Password and
   passkey ceremony time is included after submit; time spent waiting on the
   unlock screen before submitting is excluded.
6. Carry trace metadata across `tabs.update` document replacements in
   per-tab browser storage: `storage.session` on Chromium MV3 and a
   TTL-protected `storage.local` fallback on Firefox/MV2.
7. Do not add a telemetry query parameter to destination URLs.
8. Do not change `shouldShowDeepLinkInterstitial`, signature verification,
   route selection, or trusted-origin behavior.
9. Do not add `forceTransaction` to call sites. Extension `TraceRequest` does
   not expose it; `shared/lib/trace.ts` handles root/active-parent behavior.
   Background Processed is normally standalone; UI Navigated relies on this
   helper when UI Startup is active.
10. Do not implement mobile's unused `resolve`, Intent Prepare, Homepage Ready,
    or `metrics_opt_in` paths.
11. Do not emit `after_gate`. Extension resolves the destination before the
    Continue CTA is available, so it has no post-Continue deeplink processing
    stage equivalent to mobile's `after_gate`.
12. Do not instrument deferred/post-install deeplinks in v1. They flow through
    `setDeferredDeepLink` / `getDeferredDeepLinkRoute` /
    `useOnboardingCompletion`, not `DeepLinkRouter`, and need a separate
    in-app handoff design.

## Trace contract

Add these enum values to `shared/lib/trace.ts`:

```typescript
export enum TraceName {
  // Existing values...
  DeeplinkProcessed = 'Deeplink Processed',
  DeeplinkNavigated = 'Deeplink Navigated',
  DeeplinkSignatureVerify = 'Deeplink Signature Verify',
  NotificationListTimeToContent = 'Notification List Time To Content',
  HomeBannerTimeToContent = 'Home Banner Time To Content',
}

export enum TraceOperation {
  // Existing values...
  DeeplinkPerformance = 'deeplink.performance',
  NotificationPerformance = 'notification.performance',
  BannerPerformance = 'banner.performance',
}
```

Do not reuse the existing `NotificationDisplay`; it represents a different
measurement.

### Start tags versus end attributes

`trace({ tags })` creates start tags. `endTrace({ data })` writes span
attributes. Preserve this distinction because Sentry Discover filtering differs
between the two. Keep proposed start tags non-numeric: this helper converts
numeric `tags` into measurements. Settlement values, including numeric counts,
belong in `endTrace({ data })`.

| Trace | Start tags | End attributes |
| --- | --- | --- |
| Processed | `deeplink_route`, `deeplink_variant`, `signed`, `start_source` | `success`, `seam`, `segment`, `interstitial`, optional `target_route`, optional `reason` |
| Navigated | `deeplink_route`, `deeplink_variant`, `signed`, `start_source` | `success`, `nav_target`, `target_route`, `focused_route`, optional `reason` |
| Notification list | none | `success`, `source`, `notification_count`, `content_state`, optional `reason` |
| Home banner | `placement_id` | `success`, `source`, `placement_id`, optional `banner_name`, optional `reason` |

## Phase 1: shared deeplink performance primitives

### Files

- Add `shared/lib/deep-links/performance.ts`
- Add `shared/lib/deep-links/performance.test.ts`
- Update `shared/lib/trace.ts`

### Public types

Use a narrow, serializable record:

```typescript
export type DeepLinkUrlTags = {
  deeplink_route: string;
  deeplink_variant: string;
  signed: boolean;
};

export type PendingDeepLinkNavigation = {
  id: string;
  intakeTimestamp: number;
  createdAt: number;
  urlTags: DeepLinkUrlTags;
  targetRoute: string;
  interstitial: 'shown' | 'skipped';
};
```

`targetRoute` is the stable public handler pathname
(`parsed.route.pathname`), not `parsed.destination.path`. Concrete internal
paths can contain asset IDs or market symbols. Store only `urlTags` and this
stable identifier; never persist or send the raw public URL, concrete
destination path, signatures, addresses, symbols, attribution IDs, or
arbitrary query parameters.

All persisted/backdated trace timestamps are absolute epoch milliseconds in
the same coordinate system as `getPerformanceTimestamp()`
(`performance.timeOrigin + performance.now()`). Never persist
`performance.now()` or reuse another realm's `performance.timeOrigin`.

Use a five-minute TTL when reading a record. Expired records are removed and
ignored.

### URL tags

Implement:

```typescript
export function getDeepLinkUrlTags(urlString: string): DeepLinkUrlTags;
```

Rules:

- `deeplink_route`: first non-empty path segment, else hostname, else
  `unknown`.
- `deeplink_variant`: `screen`, then `tab`, if it matches
  `^[a-z][a-z-]{0,23}$`; otherwise `default`.
- `signed`: `url.searchParams.has('sig')`.
- Invalid URL: `unknown`, `default`, `false`.
- Do not include arbitrary query values, signatures, addresses, symbols, or
  attribution IDs.

### Per-tab session record

Implement storage helpers in the same module:

```typescript
export async function setPendingDeepLinkNavigation(
  tabId: number,
  record: PendingDeepLinkNavigation,
): Promise<void>;

export async function getPendingDeepLinkNavigation(
  tabId: number,
): Promise<PendingDeepLinkNavigation | null>;

export async function removePendingDeepLinkNavigation(
  tabId: number,
  expectedId: string,
): Promise<void>;

export async function clearPendingDeepLinkNavigation(
  tabId: number,
): Promise<void>;

export async function removeExpiredPendingDeepLinkNavigations(): Promise<void>;

export async function getCurrentTabId(): Promise<number | null>;
```

UI-side `getCurrentTabId()` must use
`browser.tabs.getCurrent()?.id ?? null` (or the equivalent existing
`global.platform.currentTab()` wrapper). Do not query the active tab: this
deeplink UI is a full-tab extension document, not a popup/sidepanel. Every
caller no-ops when no current tab ID exists.

Storage key:

```text
deepLinkNavigationTrace:<tabId>
```

Select the storage area through one helper:

- Chromium MV3: `browser.storage.session`.
- Firefox/MV2: `browser.storage.local`.

The fallback is required because Firefox does not support `storage.session`
(the existing guard and comment are in `app/scripts/ui.js`). The five-minute
TTL and expected-ID removal are mandatory for `storage.local`, so telemetry
state does not become durable application state. Use the same helper for
`get`, `set`, and `remove`.

Have `DeepLinkRouter.install()` trigger a non-blocking expired-record sweep and
register a `browser.tabs.onRemoved` listener that removes that tab's record.
Remove the listener in `uninstall()`. This handles abandoned interstitial tabs
and clears fallback records left by a prior browser crash on the next router
startup.

Navigating Back/forward away from the interstitial without closing the tab
does not fire `tabs.onRemoved`; that abandoned record intentionally relies on
the TTL sweep or a later same-tab request.

`removePendingDeepLinkNavigation` must compare `expectedId` before deleting.
This prevents an old asynchronous cleanup from deleting a newer deeplink in the
same tab. Reserve unconditional `clearPendingDeepLinkNavigation` for
`tabs.onRemoved` and expired-record sweeping, where the tab/record is known to
be abandoned.

Use `crypto.randomUUID()` for `id`. The ID is a local `trace()` map key and a
stale-operation token; it is not sent as a Sentry tag.

### Tests

Cover:

- HTTPS and custom-scheme route extraction.
- `screen` takes precedence over `tab`.
- invalid/high-cardinality variants become `default`.
- `signed` is true for any `sig` parameter, including an invalid signature.
- invalid URLs produce safe defaults.
- records round-trip by tab ID.
- wrong `expectedId` cannot remove a newer record.
- unconditional clear is used only for an abandoned tab/expired record.
- expired records are removed.
- expired-record sweep ignores unrelated storage keys.
- missing current tab returns `null`.

Mock `webextension-polyfill`; do not use real browser storage in unit tests.

## Phase 2: Deeplink Processed in the background

### Files

- Update `app/scripts/lib/deep-links/deep-link-router.ts`
- Update `app/scripts/lib/deep-links/deep-link.router.test.ts`

### Start

In `tryNavigateTo`, after rejecting `TAB_ID_NONE` and overlong URLs but before
calling `parse`:

1. Capture `intakeTimestamp = getPerformanceTimestamp()`.
2. Generate `id`.
3. Read and retain the ID of any pre-existing pending record for this tab.
4. Start Processed with:
   - `id`
   - `op: TraceOperation.DeeplinkPerformance`
   - URL tags
   - `start_source: 'parse'`
5. Keep the returned context for Signature Verify.

Do not start a trace for a request the router intentionally ignores.

### End branches

End immediately before calling `redirectTab`:

| Router result | Processed result |
| --- | --- |
| Internal destination, interstitial skipped | `success: true`, `seam: pre_navigate`, `segment: full`, `interstitial: skipped`, `target_route: parsed.route.pathname` |
| Internal destination, interstitial shown | `success: true`, `seam: pre_navigate`, `segment: before_gate`, `interstitial: shown`, `target_route: parsed.route.pathname` |
| External `redirectTo`, interstitial skipped | Same Processed `full/skipped` success, but do not create Navigated state |
| External `redirectTo`, interstitial shown | Same Processed `before_gate/shown` success, but do not create Navigated state |
| `parse` returns `false` | `success: false`, `reason: rejected`, `segment: full` |
| Exception | `success: false`, `reason: error`, `segment: full` |

Retain current 404 and redirect behavior after ending the trace.

### Create Navigated handoff

For an internal destination only, write `PendingDeepLinkNavigation` before
`redirectTab`:

```typescript
{
  id,
  intakeTimestamp,
  createdAt: Date.now(),
  urlTags: getDeepLinkUrlTags(url.toString()),
  targetRoute: parsed.route.pathname,
  interstitial: shouldShowInterstitial ? 'shown' : 'skipped',
}
```

If storage write fails:

- capture/log the failure using existing error handling;
- best-effort remove the pre-existing record using its captured ID;
- continue navigation;
- do not block the deeplink;
- Processed remains valid, but Navigated will be absent.

On parse rejection, error, 404, or an external `redirectTo`, remove only the
pre-existing record ID captured for this request. Never use unconditional
removal from an in-flight router request: an older request could otherwise
delete a newer request's handoff.

### Important ordering

The intended order is:

```text
capture intake time
→ read existing per-tab record ID
→ start Processed
→ parse/verify
→ evaluate existing interstitial policy
→ persist Navigated handoff (internal destinations only)
→ end Processed
→ redirectTab
```

Do not await `tabs.update` inside Processed; the seam is pre-navigation.

### Tests

Extend the router tests to assert:

- start fields for a valid deeplink;
- `full/skipped` on trusted or preference-skipped navigation;
- `before_gate/shown` when the existing policy requires the interstitial;
- `rejected` and `error`;
- `target_route` uses the stable public route identifier and never a concrete
  internal path;
- session state is written before redirect;
- external destinations do not leave Navigated state;
- storage failure does not prevent redirect;
- tab removal cleans up its pending record and uninstall removes the listener;
- the policy function receives exactly the same inputs as before.

The tests must not assert or introduce any new interstitial bypass.

## Phase 3: Signature Verify child

### Files

- Update `shared/lib/deep-links/parse.ts`
- Update `shared/lib/deep-links/parse.test.ts`
- Update `app/scripts/lib/deep-links/deep-link-router.ts`

### Parse option

Extend the existing options bag with an optional trace parent:

```typescript
type ParseOptions = {
  navigationOrigin?: NavigationOrigin;
  traceContext?: TraceContext;
};
```

Only the external-navigation branch verifies a signature. Emit the child only
when that URL has a `sig` parameter and a Processed parent; still call
`verify()` unchanged for unsigned external URLs:

```typescript
const shouldTraceSignature =
  options?.traceContext && url.searchParams.has(SIG_PARAM);

const signature = shouldTraceSignature
  ? await trace(
      {
        name: TraceName.DeeplinkSignatureVerify,
        op: TraceOperation.DeeplinkPerformance,
        parentContext: options.traceContext,
      },
      () => verify(url),
    )
  : await verify(url);
```

Do not move verification, make it conditional on metrics consent, catch its
errors differently, or change the `NavigationOrigin.INTERNAL` bypass.

Pass the parent only from the background router. The interstitial UI also calls
`parse`, but it has no Processed parent in v1 and follows the unchanged
no-parent branch. The router parent is only created for intercepted
`DEEP_LINK_HOST` requests, satisfying mobile's supported-universal-link-domain
condition without adding another verification bypass.

### Tests

- Signed external parse with a parent creates the child.
- Unsigned external parse or parse without a parent still verifies normally
  without creating the child.
- Internal parse does not create Signature Verify.
- Verify resolve/reject behavior is unchanged.

## Phase 4: preserve the interstitial boundary

No Processed span starts in `DeepLink.tsx`.

Extension performs its second `parse` and computes `route.href` before the
Continue CTA is available. This is pre-gate work, not mobile's post-Continue
`after_gate`. Emitting it as `after_gate` would make cross-client dashboards
incorrect; emitting an empty click span would not measure useful work.

Keep the interstitial component and its existing `href` unchanged. The
destination document will backdate an unlocked Navigated span to
`record.intakeTimestamp`, preserving mobile's inclusion of interstitial dwell.

Consequences to document in Sentry:

- Extension emits `segment: full` or `segment: before_gate`, never
  `segment: after_gate`.
- Mobile's `count(before_gate) - count(after_gate)` rejection calculation is
  not available for Extension.
- Measuring the UI's second parse or time-to-interstitial-ready requires a
  separately named follow-up trace.

## Phase 5: Deeplink Navigated across destination and unlock

### Files

- Add `ui/hooks/useDeepLinkNavigationTrace.ts`
- Add `ui/hooks/useDeepLinkNavigationTrace.test.tsx`
- Add a small observer component to `ui/pages/routes/routes.component.tsx`
- Update:
  - `ui/pages/unlock-page/unlock-page.component.tsx`
  - `ui/pages/unlock-page/unlock-page.component.test.tsx`
  - `ui/pages/unlock-page/passkey/unlock-passkey-section.tsx`
  - `ui/pages/unlock-page/passkey/unlock-passkey-section.test.tsx`

Keep mutable trace state in the new hook module so it survives React Router
navigation inside one UI document:

```typescript
type ActiveNavigationTrace = {
  id: string;
  targetRoute: string;
};
```

Expose helpers for unlock entry points:

```typescript
export async function startPendingDeepLinkUnlockTrace(): Promise<string | null>;

export function cancelPendingDeepLinkUnlockTrace(
  id: string | null,
  reason: 'unlock_failed',
): void;
```

The start helper:

1. Captures `getPerformanceTimestamp()` before its first `await`.
2. Gets current tab ID and pending record.
3. Starts Navigated using `startTime: submitTimestamp`.
4. Uses `record.urlTags`, `start_source: unlock`, and `id: record.id`.
5. Returns the record ID as the stale-operation token.

If there is no pending record, it is a no-op.

The cancel helper ends only when the supplied ID matches the active trace.
This prevents a stale failed attempt from ending a newer attempt.

Unlike mobile's trace utility, extension `shared/lib/trace.ts` has no automatic
five-minute cleanup for manually started traces. When Navigated starts, arm a
five-minute timer. If it has not settled, end it with
`success: false, reason: timed_out`, remove the matching stored record, and
clear module-local state. Clear the timer on every normal end/cancel. This is
required to avoid retaining an open span for the lifetime of a long-lived
extension tab.

### Password integration

In `UnlockPage.handleSubmit`:

```text
validate non-empty/not-submitting
→ startPendingDeepLinkUnlockTrace()
→ existing onSubmit(password)
→ existing navigateAfterUnlock()
```

In `catch`, cancel with `unlock_failed` before or alongside existing login
error handling. Do not include the time before form submission.

### Passkey integration

In `runPasskeyUnlock`, start immediately before `unlockWithPasskey()`.

- This covers button-triggered and mount auto-prompt flows.
- On any failed or cancelled ceremony, cancel with `unlock_failed`.
- On success, leave the trace open through `onUnlockSuccess()` and route
  commit.

If sidepanel passkey handling opens a new full-screen unlock tab, the original
per-tab handoff cannot follow automatically. Treat that as an explicit initial
limitation: no Navigated trace for this cross-tab transfer. Do not copy the
record to a second tab without a separate design.

### Route observer

Mount one `DeepLinkNavigationTraceObserver` near the top of the route tree so it
can observe `/unlock` and authenticated destinations. It renders `null`.

On location or unlock-state change:

1. Read current tab's pending record.
2. If locked, wait. The unlock entry point owns the start.
3. If the current route is the interstitial, unlock, lock, or onboarding
   route, wait. This prevents starting Navigated before an authenticated
   destination commits.
4. If the route is `BASIC_FUNCTIONALITY_OFF_ROUTE`, start the backdated intake
   trace if needed, end it with
   `success: false, reason: basic_functionality`, remove the matching record,
   and stop. This is an opt-in detour, not the requested destination.
5. Classify `location.pathname` using the existing low-cardinality `ROUTES`
   path templates (`matchPath`); use `unknown` if no template matches.
6. If unlocked and no active trace exists, start Navigated with:
   - `startTime: record.intakeTimestamp`
   - `start_source: intake`
   - `record.urlTags`
7. Schedule the success end for the next task with a zero-delay `setTimeout`,
   and cancel that callback in effect cleanup if location/unlock state changes.
   Nested route guards render `<Navigate replace>` and can otherwise redirect
   after the parent observer has already seen the requested path.
8. If the route remains stable, end:
   - `success: true`
   - `nav_target: inferred`
   - `target_route: record.targetRoute`
   - `focused_route: matchedRoute.path` (or `unknown`)
9. Remove the per-tab record with `expectedId`.
10. Clear module-local active state.

When unlock code already started the active trace, step 6 does not start
another one; the observer only ends the matching active trace.

Do not persist or emit raw `location.pathname`. Asset and perps paths can
contain dynamic identifiers. The commit is intentionally marked `inferred`
because the privacy-safe handoff does not retain the concrete target path.

### Tests

- Unlocked skipped-interstitial record starts at intake and ends on the first
  authenticated destination commit.
- Unlocked gated record also starts at original intake.
- Locked target does not start an intake trace.
- Password submit starts `unlock`; success ends after target commit.
- Password failure ends with `unlock_failed`.
- Passkey button and auto-prompt use `unlock`.
- Stale failed attempt cannot cancel a newer trace.
- Interstitial/unlock/onboarding routes do not end.
- Basic-functionality detour cancels instead of succeeding.
- Nested `<Navigate>` guard cancels the pending success callback before a
  detour commit.
- Dynamic destination paths emit a stable route template, not identifiers.
- Expired/missing record is a no-op.
- Active trace timeout ends and removes only the matching record.
- Successful end removes only the matching record.
- Strict Mode/effect reruns do not double-start or double-end.

## Phase 6: Notification List Time To Content

### Files

- Add
  `ui/hooks/metamask-notifications/useNotificationListPerformance.ts`
- Add
  `ui/hooks/metamask-notifications/useNotificationListPerformance.test.ts`
- Update `ui/pages/notifications/notifications.tsx`
- Update `ui/pages/notifications/notifications.test.tsx`
- Update
  `ui/contexts/metamask-notifications/metamask-notifications.tsx`
- Update
  `ui/contexts/metamask-notifications/metamask-notifications.test.ts`
- Update `ui/hooks/metamask-notifications/useNotifications.test.tsx`

### Correct the loading signal first

Do not wire the trace directly to today's context `isLoading`.

`MetamaskNotificationsProvider` creates one `useListNotifications()` instance,
but `useFetchInitialNotificationsEffect` reaches
`useEnableAndRefresh()`, which creates a **different**
`useListNotifications()` instance. The startup fetch therefore updates loading
state that is not exposed by the provider. A cold fetch can currently look
settled on the notifications page.

Do **not** replace the context's UI `isLoading` or pass a broader value to
`NotificationsList`: that would newly show a spinner during startup refresh
and violate the observability-only scope.

Instead, have `useFetchInitialNotificationsEffect` expose a trace-only
lifecycle (`isPending`, `error`) while preserving all current fetch/enable
behavior. It must:

- report pending synchronously on the first render when the existing
  startup-fetch prerequisites are already satisfied
  (`isNotificationServicesEnabled`, signed in, external services enabled, and
  unlocked);
- stay true through optional enable/refresh and list fetch;
- settle in `finally`;
- retain a failure value for the trace while the effect continues swallowing
  errors as it does today.

Clear that trace-only error at the start of a later attempt and on any
successful startup or provider-owned list refresh (the latter is observable
when provider `notificationsData` becomes defined). Never carry a failed
attempt across a later successful refresh.

Expose that lifecycle through the provider separately from its existing
`isLoading`/`error`. For the trace only, combine it with:

- context `isLoading` and `error` for direct provider-list calls;
- Redux `isFetchingMetamaskNotifications`;
- Redux `getIsUpdatingMetamaskNotifications` (covers optional enable work);
- initial feature-announcement preference hydration;
- completion of the page's `deleteExpiredNotifications()` dispatch;
- the deferred-list transition described below.

Do not otherwise change when notifications are enabled, disabled, fetched, or
visibly shown as loading.

Port the mobile hook with extension imports:

```typescript
type NotificationListPerformanceOptions = {
  enabled: boolean;
  isLoading: boolean;
  isPending: boolean;
  error?: unknown;
  notificationCount: number;
};
```

Implementation rules:

- Start one UUID-keyed trace per enabled effect activation.
- Keep whether any `isLoading === true` render was observed in a ref.
- Keep latest count in a ref for unmount cleanup.
- Do not call `endTrace` while `isPending === true`; an `error` is the only
  immediate-settlement exception.
- On first genuinely settled render:
  - `source: cold` if a prior render observed `isLoading === true`;
  - otherwise `source: warm`.
- If `error` is present, end `success: false, reason: error`.
- `content_state`: `filled` when count is positive, else `empty`.
- On unresolved unmount: `success: false`, `reason: unmounted`.
- Clear the active ID before calling `endTrace` to prevent duplicate cleanup.
- Do not restart on tab changes.

Call the hook after `filteredNotifications` is computed:

```typescript
const isDeferredListPending =
  deferredCombinedNotifications !== combinedNotifications;

useNotificationListPerformance({
  enabled: isMetamaskNotificationsEnabled,
  isLoading:
    traceLifecycle.isPending ||
    isLoading ||
    isFetchingNotifications ||
    isUpdatingNotifications,
  isPending:
    traceLifecycle.isPending ||
    isLoading ||
    isFetchingNotifications ||
    isUpdatingNotifications ||
    isFeatureAnnouncementPreferencePending ||
    isExpirationCleanupPending ||
    isDeferredListPending,
  error: traceLifecycle.error ?? error,
  notificationCount: filteredNotifications.length,
});
```

Use the same `filteredNotifications` passed to `NotificationsList`; this makes
`notification_count` equal to rendered content. The combined selector already
provides the extension's effective list; do not add a second deduplication
algorithm as part of instrumentation. Keep passing the original context
`isLoading` to `NotificationsList`; the composite above is trace-only.

Change `useFeatureAnnouncementsEnabled` to expose a pending state initialized
to `true` until the first `getNotificationPreferences()` attempt settles,
alongside the resolved boolean. Wrap the existing expiry-cleanup dispatch with
a page-local pending flag also initialized to `true` and cleared in `finally`.
Neither flag changes rendering; both only prevent recording a count that
immediately changes. They do not affect `source`; only list fetch/enable
loading makes an activation cold.

Including the deferred transition in `isPending` prevents settlement with the
previous list immediately before fetched rows commit. `useListNotifications`
also clears its own loading state inside `startTransition`, so do not assume
that Redux list updates and context loading settle in the same render.

Development Strict Mode can produce an unresolved `unmounted` activation
followed by the real activation; production does not enable this Strict Mode.
Do not add cross-mount global deduplication. Test that each activation is
internally idempotent and leaves no active trace after cleanup.

Tests:

- warm filled;
- warm empty;
- cold filled;
- startup/list error;
- startup failure followed by a successful refresh clears the trace-only error;
- unresolved unmount;
- disabled;
- latest count on unmount;
- no double end;
- startup lifecycle is pending on its first eligible render without changing
  `NotificationsList` loading props;
- feature-announcement preference and expiry cleanup delay settlement;
- deferred list update remains cold/loading until rendered content catches up;
- active-tab filtered count is passed by the page;
- `filterNotifications` covers ALL, WALLET, and WEB3 tab semantics.

## Phase 7: Home Banner Time To Content

### Files

- Update `ui/hooks/useCarouselManagement/useCarouselManagement.ts`
- Update `ui/hooks/useCarouselManagement/useCarouselManagement.test.ts`
- Update `ui/components/multichain/account-overview/carousel.tsx`
- Update `ui/components/multichain/account-overview/carousel.test.tsx`
- Add `ui/components/multichain/carousel/utils.ts`
- Add `ui/components/multichain/carousel/utils.test.ts`
- Update `ui/components/multichain/carousel/carousel.tsx`

The extension has Contentful carousel slides, not Braze banners. Use
`Home Banner Time To Content` and `banner.performance`.

### Lifecycle

Start once per enabled effect activation when:

- caller `enabled` is true;
- `contentfulCarouselEnabled` is true.

The layout effect is keyed by both flags: if they resolve false/undefined →
true after mount, start exactly once; if either becomes false before
settlement, end the activation as `unmounted`. A later re-enable is a new
activation.

Do not add `getUseExternalServices` as a new gate. It only affects the existing
download-slide eligibility flow.

Capture **all** persisted slide IDs at this point, not only those currently
visible. An account-type filter can hide a persisted slide and reveal it after
an account switch; it is still warm-cache content. Do not wait for
`downloadEligibilityReady` before starting or deciding whether content is
warm: persisted slides are already supplied to the renderer while lineage
eligibility is loading.

Start in the account-overview wrapper's `useLayoutEffect`. The inner
carousel reports its first active card from a passive effect, so a normal
parent passive effect can run too late and miss warm content. Keep the trace
ID in a ref and guard Strict Mode/rerenders idempotently.

Start tag:

```typescript
{ placement_id: 'home_carousel' }
```

Settlement:

| Result | End attributes |
| --- | --- |
| `onActiveSlideChange` reports a slide whose ID was present initially | `success: true`, `source: warm-cache`, `placement_id`, `banner_name` |
| `onActiveSlideChange` reports a newly fetched slide | `success: true`, `source: event`, `placement_id`, `banner_name` |
| Fetch returns no visible slides | `success: false`, `reason: empty`, `source: event`, `placement_id` |
| Fetch throws | `success: false`, `reason: error`, `source: event`, `placement_id` |
| Carousel unmounts before settlement | `success: false`, `reason: unmounted`, `placement_id` |

For `banner_name`, use `id` from the slide supplied to
`handleActiveSlideChange`, matching existing `BannerDisplay` analytics.
`BannerSelect` separately uses `variableName ?? id`; do not conflate them.

Instrument the account-overview wrapper, not `mergedSlides`, for successful
settlement. The inner carousel already applies dismissal, account-type, and
`MAX_SLIDES` filtering, renders skeletons while `getAppIsLoading` is true, and
calls `onActiveSlideChange` only when a real current card is visible. Extend
the existing callback so it ends the trace before/alongside BannerDisplay
analytics.

Extract `getVisibleCarouselSlides` from
`ui/components/multichain/carousel/carousel.tsx` into `utils.ts`; it must retain
the exact existing dismissal, selected-account, and `MAX_SLIDES` rules. Reuse
it in both the renderer and account-overview wrapper for trace classification.
Do not change `CarouselWithEmptyState`'s dismissed-only fold-animation count.

Extend `useCarouselManagement` to return a small Contentful request state
(`idle | loading | settled | error`) in addition to `slides`. Use it only to
settle `error`, or `empty` when state is `settled` and the shared helper returns
no visible slides. Never emit `empty` during `idle` or `loading`. Fetch-status
state must not alter existing effect guards, dispatch timing, or rendering.

Use an idempotent helper:

```typescript
const endBannerTrace = useCallback(
  (data: Record<string, number | string | boolean>) => {
    const id = traceIdRef.current;
    if (id === null) {
      return;
    }
    traceIdRef.current = null;
    endTrace({ name: TraceName.HomeBannerTimeToContent, id, data });
  },
  [],
);
```

Do not add a timeout in this change. The extension has no banner skeleton
timeout today; adding one would alter product behavior and would not be a
telemetry-only port.

Do not settle success merely because `getAppIsLoading` becomes false. Its
existing use is still important because the carousel shows skeletons while it
is true; `onActiveSlideChange` is the final content-ready seam.

Development Strict Mode can create an unresolved `unmounted` activation before
the real activation; production does not enable this Strict Mode. Keep each
activation internally idempotent rather than deduplicating globally across
mounts.

Tests:

- trace does not start while gates are unresolved/off;
- flags resolving enabled after mount start exactly once; disable/re-enable
  creates separate, settled activations;
- warm cached content;
- fetched content;
- fetched empty;
- idle/loading never settles empty;
- fetch error;
- unmount before fetch resolves;
- account switch revealing an initially persisted ID remains `warm-cache`;
- rerenders/dependency changes do not double-start/end;
- the trace starts before the child's initial active-slide effect;
- global loading delays success until a real slide is displayed;
- visibility helper matches dismissal, Solana-account, and maximum-slide rules;
- `banner_name` matches the slide reported by `onActiveSlideChange`.

## Phase 8: documentation and sampling

Update this guide if implementation discovers a different seam.

Add the new transaction names to remote Sentry sampling configuration only if
observed volume requires an override. Do not add a zero or arbitrary local
sample-rate override in `DEFAULT_TRANSACTION_SAMPLE_RATES`; the global rate
should apply initially.

Sampling overrides are keyed by the exact emitted transaction **name**, not
the TypeScript enum member. Use `Deeplink Processed`, `Deeplink Navigated`,
`Notification List Time To Content`, or `Home Banner Time To Content`; do not
use `DeeplinkProcessed`-style keys. Confirm the remote flag schema accepts a
new name before relying on an override.

Recommended Sentry queries:

```text
transaction:"Deeplink Processed" deeplink_route:swap start_source:parse
transaction:"Deeplink Processed" segment:before_gate
transaction:"Deeplink Navigated" start_source:unlock
transaction:"Notification List Time To Content"
transaction:"Home Banner Time To Content" placement_id:home_carousel
```

Remember that `success`, `seam`, `reason`, and most settlement fields are span
attributes written at end, not start tags.

## Verification commands

Run focused tests after each phase:

```bash
yarn test:unit shared/lib/deep-links/performance.test.ts
yarn test:unit shared/lib/deep-links/parse.test.ts
yarn test:unit app/scripts/lib/deep-links/deep-link.router.test.ts
yarn test:unit ui/hooks/useDeepLinkNavigationTrace.test.tsx
yarn test:unit ui/pages/unlock-page/unlock-page.component.test.tsx
yarn test:unit ui/pages/unlock-page/passkey/unlock-passkey-section.test.tsx
yarn test:unit ui/hooks/metamask-notifications/useNotificationListPerformance.test.ts
yarn test:unit ui/contexts/metamask-notifications/metamask-notifications.test.ts
yarn test:unit ui/hooks/metamask-notifications/useNotifications.test.tsx
yarn test:unit ui/pages/notifications/notifications.test.tsx
yarn test:unit ui/hooks/useCarouselManagement/useCarouselManagement.test.ts
yarn test:unit ui/components/multichain/account-overview/carousel.test.tsx
yarn test:unit ui/components/multichain/carousel/utils.test.ts
```

Then run:

```bash
yarn lint:changed:fix
yarn lint:tsc
```

Run relevant existing deep-link E2E tests if routing-adjacent code changes:

```bash
yarn test:e2e:single test/e2e/tests/deep-link/deep-link-redirects.spec.ts --browser=chrome
yarn test:e2e:single test/e2e/tests/deep-link/deep-link-route-home.spec.ts --browser=chrome
```

These require a test build first.

## Manual acceptance matrix

Use a build with Sentry enabled, and enable Metrics/Sentry consent. UI behavior
must remain unchanged.

| Case | Expected Processed | Expected Navigated |
| --- | --- | --- |
| Unlocked, trusted origin, `/swap` | one `full/skipped` | `start_source:intake`, inferred commit, stable swap route |
| Unlocked, interstitial, Continue | one `before_gate`; no `after_gate` on Extension | `start_source:intake`; duration includes gate dwell |
| Locked, interstitial, Continue, password unlock | one `before_gate`; no `after_gate` on Extension | `start_source:unlock`; begins at submit |
| Locked, skipped interstitial, failed password | one `full/skipped` | `success:false`, `reason:unlock_failed` |
| Any external `redirectTo` route (buy, sell, card, money, and others) | one Processed | none |
| Destination redirected to basic-functionality opt-in | one Processed | `success:false`, `reason:basic_functionality` |
| Invalid/unsupported route | Processed rejected/error | none |
| Notifications already loaded | notification `source:warm` | not applicable |
| Notifications fetching | notification `source:cold` | not applicable |
| Cached carousel content | banner `source:warm-cache` | not applicable |
| Contentful fetch supplies first slide | banner `source:event` | not applicable |

## Pull request boundaries

Prefer three reviewable PRs:

1. Deeplink traces: phases 1–5.
2. Notification list trace: phase 6.
3. Home banner trace: phase 7.

All are observability-only. Any change that causes fewer deeplinks to show the
security interstitial is outside this guide and requires explicit, documented
approval from `@MetaMask/extension-security-team` before implementation.
