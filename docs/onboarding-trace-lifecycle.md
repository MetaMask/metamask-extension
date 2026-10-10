# Onboarding Trace Lifecycle

Implementation tracker for centralizing the `Onboarding - Overall Journey` Sentry span in the browser extension and recording abandoned onboarding sessions.

## Goal

Ensure every onboarding journey has one lifecycle owner, one start, and one idempotent end. Completed journeys should be tagged with `outcome: completed`; sessions that leave onboarding or close the extension UI should be tagged with `outcome: abandoned` and the last known onboarding step.

## Current state

- The journey starts in `ui/pages/onboarding-flow/onboarding-flow.tsx` on mount.
- The journey currently ends in multiple screens:
  - `ui/pages/onboarding-flow/create-password/create-password.tsx`
  - `ui/pages/onboarding-flow/recovery-phrase/review-recovery-phrase.tsx`
  - `ui/pages/onboarding-flow/recovery-phrase/confirm-recovery-phrase.tsx`
  - `ui/pages/unlock-page/unlock-page.component.tsx`
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

The helper must not mutate `onboardingParentContext`. Until lifecycle ownership is
integrated into `OnboardingFlow`, the existing owner continues to provide the
current parent-context propagation exactly as before.

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

Move overall-journey completion ownership into `OnboardingFlow`:

| Path | Central completion point | Expected outcome |
| --- | --- | --- |
| New SRP | Successful review/confirm navigation | `completed` |
| SRP import | Successful password/import action | `completed` |
| Social wallet creation | Successful wallet creation action | `completed` |
| Unlock completion | Successful unlock navigation that exits onboarding | `completed` |
| Route-away or closed UI | Lifecycle cleanup | `abandoned` |

Child screens may continue ending their own child spans, but must not directly end `OnboardingJourneyOverall`.

### Browser lifecycle behavior

Use route-away cleanup and browser lifecycle handling together. A hidden document can be a normal part of social OAuth, so visibility handling must not immediately classify every hidden state as abandonment. `pagehide`/unmount handling should be idempotent and should tolerate terminal completion having already ended the span.

Consider adding the mobile-equivalent timeout safety net to `shared/lib/trace.ts` so an orphaned manual span cannot remain pending indefinitely. The timeout is a fallback, not a replacement for explicit `outcome: abandoned` cleanup.

## Implementation checklist

- [x] Add the central onboarding trace helper/hook.
- [ ] Invoke `startJourney` exactly once from the single lifecycle owner.
- [ ] Track the last onboarding route/step.
- [ ] Centralize successful terminal endings in `OnboardingFlow`.
- [ ] Remove overall-journey `bufferedEndTrace` calls from child screens.
- [ ] Add route-away and browser lifecycle abandonment cleanup.
- [ ] Make completion and abandonment ending idempotent.
- [ ] Decide whether to add the trace timeout fallback to `shared/lib/trace.ts`.
- [ ] Add regression tests for all four terminal paths.
- [ ] Add tests for abandonment and repeated cleanup signals.
- [ ] Run `yarn lint:changed:fix`.
- [ ] Run the focused unit tests and any relevant trace-service tests.

## Test matrix

The tests should assert that the overall journey end request is emitted exactly once and includes the expected outcome and last step.

- [ ] New SRP completion from review screen.
- [ ] New SRP completion from confirm screen.
- [ ] SRP import completion.
- [ ] Social wallet creation completion.
- [ ] Unlock-completion flow.
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
