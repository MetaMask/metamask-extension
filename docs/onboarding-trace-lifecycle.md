# Onboarding Trace Lifecycle

Implementation tracker for centralizing the `Onboarding - Overall Journey` Sentry span in the browser extension and recording abandoned onboarding sessions.

## Goal

Ensure every onboarding journey has one lifecycle owner, one start, and one
idempotent end. Completed journeys are tagged with `success: true`; active
journeys whose onboarding tab is removed are tagged with
`success: false, abandoned: true` and the last known onboarding step.

## Current state

- `OnboardingFlow` owns one `OnboardingTraceProvider` and explicitly starts the
  journey through `useOnboardingTrace`.
- The provider exposes one shared lifecycle API to all onboarding screens.
  Terminal actions call `endJourney({ success: true })` through the context instead
  of receiving a completion callback through route props.
- The overall journey is completed from these terminal actions:
  - `ui/pages/onboarding-flow/create-password/create-password.tsx`
  - `ui/pages/onboarding-flow/recovery-phrase/review-recovery-phrase.tsx`
  - `ui/pages/onboarding-flow/recovery-phrase/confirm-recovery-phrase.tsx`
  - `ui/pages/onboarding-flow/onboarding-flow.tsx` (`handleUnlock`)
- The legacy class-based unlock implementation ends only its child login span;
  the overall journey is completed by `OnboardingFlow` after the unlock action
  succeeds and before `navigateAfterUnlock`.
- In-app exits to non-onboarding routes are intentionally outside the
  abandonment metric; successful terminal actions own completion.
- `OnboardingController` owns a background per-tab registry. The onboarding UI
  sends only step and result data through connection-scoped background methods.
  A dedicated trusted-connection adapter supplies its `sender.tab.id` when
  available before calling the controller; the UI never reads or sends the
  browser tab ID. Missing tab identity does not disable tracing, but it cannot
  receive a tab-removal abandonment signal.
- `OnboardingController` generates an opaque trace ID and returns it to the UI
  for child trace parent-context propagation. It delegates only generic
  `bufferedTrace` and `bufferedEndTrace` calls to `SentryTracingService`.
- A reload reconnects to the same tab and updates the existing registry entry;
  it does not end or restart the Sentry trace.
- `tabs.onRemoved` is the abandonment signal. A removed tab ends the active
  journey with `success: false, abandoned: true`.
- There is no route-away abandonment observer, React unmount cleanup,
  `pagehide` listener, `sessionStorage` state, or timeout workaround. Route
  changes only synchronize the last known step with the background registry.
  The omitted lifecycle signals are either not reliable for this full-screen
  flow or would incorrectly classify reloads and in-app navigation.
- The MetaMetrics trace methods cross the UI/background boundary through the
  `OnboardingController`; lifecycle calls use generic `bufferedTrace` and
  `bufferedEndTrace` rather than calling shared trace functions directly from
  UI code.

## Implemented design

### UI lifecycle helper

Use a TypeScript hook under `ui/pages/onboarding-flow/hooks/` that owns:

- Providing an explicit `startJourney` API for `TraceName.OnboardingJourneyOverall`.
- Tracking the current route as `last_step`.
- Ending the journey exactly once with an idempotent ref.
- Ending completed journeys before successful terminal navigation.
- Sending background step updates while the onboarding route changes.
- Keeping tab identity resolution in the trusted background connection.

The helper owns the serializable `onboardingParentContext` assignment when
`startJourney` runs. This is an intentional ref mutation: child screens use the
identity to parent their own traces, and a live Sentry span cannot cross the
UI/background RPC boundary.

The caller explicitly invokes `startJourney`; the helper does not assume that
every mount of `OnboardingFlow` is the beginning of a user journey.

Suggested end attributes:

```ts
{
  success: boolean,
  abandoned?: true,
  last_step: string,
}
```

### Terminal ownership

Keep lifecycle ownership in the provider, while terminal actions explicitly
complete the shared lifecycle before successful navigation:

| Path | Completion action | Expected outcome |
| --- | --- | --- |
| New SRP | Review “remind later” or confirm action | `success: true` |
| SRP import | Successful password/import action | `success: true` |
| Social wallet creation | Successful wallet creation action | `success: true` |
| Unlock completion | `OnboardingFlow.handleUnlock` after a successful unlock | `success: true` |
| Removed onboarding tab | Background `tabs.onRemoved` signal | `success: false, abandoned: true` |

Child screens may continue ending their own child spans, but must not directly
call `bufferedEndTrace` for `OnboardingJourneyOverall`.

### Background lifecycle behavior

The background owns closure detection with the browser tab-removal event. A
reload keeps the same tab ID, so `OnboardingController` retains the registry
entry and the new UI instance resumes it. A hidden document, route change, or
component unmount is not treated as abandonment.

## Implementation checklist

- [x] Add the central onboarding trace helper/hook.
- [x] Invoke `startJourney` exactly once from the single lifecycle owner.
- [x] Track the last onboarding route/step.
- [x] Centralize successful terminal endings behind the shared lifecycle API.
- [x] Remove overall-journey `bufferedEndTrace` calls from child screens.
- [x] Add an `OnboardingController` per-tab registry and `tabs.onRemoved`
  abandonment handling.
- [x] Keep reloads on the same tab journey without starting a second trace.
- [x] Make the shared completion/abandonment end API idempotent.
- [x] Remove UI `sessionStorage`, `pagehide`, unmount, route-away abandonment,
  and timeout handling.
- [x] Add regression tests for the listed terminal paths.
- [x] Add tests for tab-removal abandonment and repeated end signals.
- [x] Run the final focused tests and lint after the background RPC refactor.
- [ ] Manually verify reload versus tab close in the full-screen onboarding tab.

## Test matrix

The tests should assert that the overall journey end request is emitted exactly
once and includes the expected result and last step.

- [x] New SRP completion from review screen.
- [x] New SRP completion from confirm screen.
- [x] SRP import completion.
- [x] Social wallet creation completion.
- [x] Unlock-completion flow.
- [x] Tab-removal abandonment.
- [x] Reload resumes the existing tab journey without a second start trace.
- [x] Duplicate completion plus tab removal do not produce a second end.
- [x] Multiple onboarding tabs remain isolated from one another.

## Mobile reference

The mobile implementation provides the reference lifecycle pattern:

- `app/components/Views/Onboarding/index.tsx` owns journey cleanup on unmount.
- Mobile finalizes successful terminal paths before navigation.
- `app/util/trace.ts` caps manually-ended traces with a cleanup interval.

The extension needs the same ownership model adapted to React Router and the UI/background RPC boundary.

## Progress log

### 2026-10-09

- Confirmed the extension has one journey start and scattered journey ends.
- Confirmed the extension has no manual-trace cleanup timer.
- Compared the lifecycle and timeout behavior with the mobile implementation.
- Created this implementation tracker.
- Added `useOnboardingTrace` with an explicit start API, route-based last-step
  tracking, idempotent ending, and colocated unit tests. The start boundary is
  explicitly controlled by the caller, and the helper preserves child-span
  parent-context propagation.

### 2026-10-10

- Wired `useOnboardingTrace` into `OnboardingFlow` as the single start owner;
  existing terminal end call sites remain unchanged for the next step.

### 2026-10-15

- Audited the local `feat/onboarding-journey-trace-consolidation` branch.
- Confirmed the helper, explicit start owner, route tracking, and idempotent
  `endJourney` API are present.
- Confirmed route-away, unmount, `pagehide`, and visibility/lifecycle
  abandonment handling have not been implemented.
- Confirmed the manual-trace timeout fallback in `shared/lib/trace.ts` has not
  been implemented.
- Made `startJourney` idempotent so development StrictMode effect execution
  cannot start the overall journey more than once for the mounted owner.
- Moved serialized `onboardingParentContext` assignment into
  `useOnboardingTrace`, keeping parent-context setup next to the overall trace
  start while preserving child-span propagation.
- Added a shared onboarding trace context so child route components can consume
  the one lifecycle instance directly without `onJourneyComplete` prop-drilling.
- Centralized successful completion through `endJourney('completed')` and
  removed direct overall-journey end calls from child screens.
- Added terminal-path and shared-context regression coverage.
- Moved successful unlock completion into `OnboardingFlow.handleUnlock`, so the
  unlock screen no longer owns the overall journey lifecycle.
- Removed route-away tracking because in-app exits are intentionally not part
  of the abandonment metric.
- Added `pagehide` cleanup with idempotent duplicate handling.
- Added OAuth-in-progress coordination so temporary social-login backgrounding
  does not end the onboarding journey.
- The abandonment lifecycle tests pass: 2 suites and 10 tests.
- The focused test assertions pass: 8 suites and 95 tests. The command still
  exits non-zero because the console-baseline check reports two existing
  Suspense warnings in the newly covered `onboarding-flow.test.tsx`.
- `yarn lint:changed:fix` and the editor linter report no errors.

### 2026-10-15 (background lifecycle revision)

- Moved abandonment ownership from the UI lifecycle to the background
  `OnboardingController`.
- Added a per-tab registry, a dedicated trusted-connection adapter for tab-ID
  injection, and `tabs.onRemoved` handling.
- Changed the end payload to the shared `{ success, abandoned? }` type.
- Removed UI tab-ID lookup, `sessionStorage`, `pagehide`, unmount, route-away
  abandonment, and timer handling so reloads and allowed in-app navigation do
  not end the journey.
- Updated the lifecycle tests and documentation to cover reload/resume and
  tab-removal abandonment.

### 2026-10-15 (ownership refinement)

- Moved onboarding journey lifecycle methods out of the generic
  `SentryTracingService` and into `OnboardingController`.
- Kept `SentryTracingService` focused on generic trace buffering and consent
  handling.
- Moved tab-ID injection into a dedicated connection API adapter so
  `metamask-controller.js` only wires the connection API.

## Next implementation step

Run the focused lint/type checks, then manually verify in the full-screen
onboarding tab that reload resumes the same journey while closing the tab emits
one abandonment end.
