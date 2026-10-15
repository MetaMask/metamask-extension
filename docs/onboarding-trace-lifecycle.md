# Onboarding Trace Lifecycle

Implementation tracker for centralizing the `Onboarding - Overall Journey` Sentry span in the browser extension and recording abandoned onboarding sessions.

## Goal

Ensure every onboarding journey has one lifecycle owner, one start, and one
idempotent end. Completed journeys should be tagged with `outcome: completed`;
active sessions that close the extension UI should be tagged with
`outcome: abandoned` and the last known onboarding step.

## Current state

- `OnboardingFlow` owns one `OnboardingTraceProvider` and explicitly starts the
  journey through `useOnboardingTrace`.
- The provider exposes one shared lifecycle API to all onboarding screens.
  Terminal actions call `endJourney('completed')` through the context instead
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
- No trace-service timeout fallback is needed for this lifecycle: expected
  completion and abandonment paths explicitly end the journey, and
  `pagehide` handles closing the onboarding page.
- The MetaMetrics trace methods cross the UI/background boundary through `SentryTracingService`; lifecycle calls must continue using `bufferedTrace` and `bufferedEndTrace` rather than calling shared trace functions directly from UI code.

## Proposed design

### Central lifecycle helper

Add a TypeScript helper or hook under `ui/pages/onboarding-flow/hooks/` that owns:

- Providing an explicit `startJourney` API for `TraceName.OnboardingJourneyOverall`.
- Tracking the current route as `last_step`.
- Ending the journey exactly once with an idempotent ref.
- Ending completed journeys before successful terminal navigation.
- Ending abandoned journeys on `pagehide`.

The helper owns the serializable `onboardingParentContext` assignment when
`startJourney` runs. This is an intentional ref mutation: child screens use the
identity to parent their own traces, and a live Sentry span cannot cross the
UI/background RPC boundary.

The caller explicitly invokes `startJourney`; the helper does not assume that
every mount of `OnboardingFlow` is the beginning of a user journey.

Suggested end attributes:

```ts
{
  outcome: 'completed' | 'abandoned',
  last_step: string,
}
```

### Terminal ownership

Keep lifecycle ownership in the provider, while terminal actions explicitly
complete the shared lifecycle before successful navigation:

| Path | Completion action | Expected outcome |
| --- | --- | --- |
| New SRP | Review “remind later” or confirm action | `completed` |
| SRP import | Successful password/import action | `completed` |
| Social wallet creation | Successful wallet creation action | `completed` |
| Unlock completion | `OnboardingFlow.handleUnlock` after a successful unlock | `completed` |
| Closed onboarding UI | `pagehide` lifecycle signal | `abandoned` |

Child screens may continue ending their own child spans, but must not directly
call `bufferedEndTrace` for `OnboardingJourneyOverall`.

### Browser lifecycle behavior

Use the browser lifecycle signal for closure. A hidden document can be a normal
part of social OAuth, so visibility handling must not immediately classify every
hidden state as abandonment. `pagehide` handles browser/window dismissal and is
idempotent with terminal completion.

The mobile-equivalent timeout safety net is intentionally out of scope here.
Adding a timer would obscure lifecycle ownership and is unnecessary for the
extension's explicit completion and `pagehide` cleanup paths.

## Implementation checklist

- [x] Add the central onboarding trace helper/hook.
- [x] Invoke `startJourney` exactly once from the single lifecycle owner.
- [x] Track the last onboarding route/step.
- [x] Centralize successful terminal endings behind the shared lifecycle API.
- [x] Remove overall-journey `bufferedEndTrace` calls from child screens.
- [x] Add browser lifecycle abandonment cleanup.
- [x] Make the shared completion/abandonment end API idempotent.
- [x] Decide not to add a trace timeout fallback; lifecycle cleanup is explicit.
- [x] Add regression tests for the listed terminal paths.
- [x] Add tests for abandonment and repeated cleanup signals.
- [x] Run `yarn lint:changed:fix`.
- [x] Run the focused onboarding unit tests.
- [x] Run relevant trace-service tests.

## Test matrix

The tests should assert that the overall journey end request is emitted exactly once and includes the expected outcome and last step.

- [x] New SRP completion from review screen.
- [x] New SRP completion from confirm screen.
- [x] SRP import completion.
- [x] Social wallet creation completion.
- [x] Unlock-completion flow.
- [x] `pagehide`/close abandonment.
- [x] Duplicate completion plus cleanup signals do not produce a second end.
- [x] Social OAuth backgrounding is not incorrectly recorded as abandonment.

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

## Next implementation step

No further lifecycle implementation is pending. The next step is review and
manual verification of the close/reload behavior in the full-screen onboarding
page; no route-away or unmount abandonment handling should be added.
