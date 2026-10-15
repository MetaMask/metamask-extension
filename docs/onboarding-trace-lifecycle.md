# Onboarding Trace Lifecycle

Implementation tracker for centralizing the `Onboarding - Overall Journey` Sentry span in the browser extension and recording abandoned onboarding sessions.

## Goal

Ensure every onboarding journey has one lifecycle owner, one start, and one idempotent end. Completed journeys should be tagged with `outcome: completed`; sessions that leave onboarding or close the extension UI should be tagged with `outcome: abandoned` and the last known onboarding step.

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
- `OnboardingFlow` remains mounted while React Router changes between onboarding routes, so unmount cleanup alone cannot identify successful terminal transitions.
- `shared/lib/trace.ts` has no timeout cleanup for manually-ended traces.
- The MetaMetrics trace methods cross the UI/background boundary through `SentryTracingService`; lifecycle calls must continue using `bufferedTrace` and `bufferedEndTrace` rather than calling shared trace functions directly from UI code.

## Proposed design

### Central lifecycle helper

Add a TypeScript helper or hook under `ui/pages/onboarding-flow/hooks/` that owns:

- Providing an explicit `startJourney` API for `TraceName.OnboardingJourneyOverall`.
- Tracking the current route as `last_step`.
- Ending the journey exactly once with an idempotent ref.
- Ending completed journeys before successful terminal navigation.
- Ending abandoned journeys on route-away, `pagehide`, or an appropriate visibility/lifecycle signal.

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
| Route-away or closed UI | Lifecycle cleanup | `abandoned` |

Child screens may continue ending their own child spans, but must not directly
call `bufferedEndTrace` for `OnboardingJourneyOverall`.

### Browser lifecycle behavior

Use route-away cleanup and browser lifecycle handling together. A hidden document can be a normal part of social OAuth, so visibility handling must not immediately classify every hidden state as abandonment. `pagehide`/unmount handling should be idempotent and should tolerate terminal completion having already ended the span.

Consider adding the mobile-equivalent timeout safety net to `shared/lib/trace.ts` so an orphaned manual span cannot remain pending indefinitely. The timeout is a fallback, not a replacement for explicit `outcome: abandoned` cleanup.

## Implementation checklist

- [x] Add the central onboarding trace helper/hook.
- [x] Invoke `startJourney` exactly once from the single lifecycle owner.
- [x] Track the last onboarding route/step.
- [x] Centralize successful terminal endings behind the shared lifecycle API.
- [x] Remove overall-journey `bufferedEndTrace` calls from child screens.
- [ ] Add route-away and browser lifecycle abandonment cleanup.
- [x] Make the shared completion/abandonment end API idempotent.
- [ ] Decide whether to add the trace timeout fallback to `shared/lib/trace.ts`.
- [x] Add regression tests for the listed terminal paths.
- [ ] Add tests for abandonment and repeated cleanup signals.
- [x] Run `yarn lint:changed:fix`.
- [x] Run the focused onboarding unit tests.
- [ ] Run relevant trace-service tests.

## Test matrix

The tests should assert that the overall journey end request is emitted exactly once and includes the expected outcome and last step.

- [x] New SRP completion from review screen.
- [x] New SRP completion from confirm screen.
- [x] SRP import completion.
- [x] Social wallet creation completion.
- [x] Unlock-completion flow.
- [ ] Route-away abandonment.
- [ ] `pagehide`/close abandonment.
- [ ] Duplicate completion plus cleanup signals do not produce a second end.
- [ ] Social OAuth backgrounding is not incorrectly recorded as abandonment.

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
- The focused test assertions pass: 7 suites and 82 tests. The command still
  exits non-zero because the console-baseline check reports two existing
  Suspense warnings in the newly covered `onboarding-flow.test.tsx`.
- `yarn lint:changed:fix` and the editor linter report no errors.

## Next implementation step

Implement abandonment cleanup in the shared lifecycle owner:

1. End with `endJourney('abandoned')` when onboarding is unmounted or the user
   routes away from onboarding.
2. Handle `pagehide`/close lifecycle signals without ending the trace twice.
3. Avoid classifying temporary social OAuth backgrounding as abandonment.
4. Add tests for route-away, unmount, repeated cleanup signals, and OAuth
   backgrounding.

After that, decide whether the manual-trace timeout fallback belongs in
`shared/lib/trace.ts` and run the relevant trace-service tests.
