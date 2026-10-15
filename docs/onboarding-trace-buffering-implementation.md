# Onboarding Trace Buffering — Implementation Plan

**Status:** Steps 1–2 complete; Steps 3–5 pending
**Related task:** TO-897, root-cause C (“single clock domain”)  
**Last updated:** 2026-10-15

## Goal

Ensure onboarding Sentry spans remain valid when they start before MetaMetrics
consent and end after consent:

- Start and end timestamps use one epoch-millisecond clock domain.
- Buffered traces retain their onboarding journey parent.
- Replayed traces do not produce negative, skewed, or fragmented spans.

## Current extension state

The task description refers to `MetaMetricsController`, but the extension queue
now lives in `SentryTracingService`:

- `app/scripts/services/sentry/sentry-tracing-service.ts` buffers and replays
  traces.
- `shared/lib/trace.ts` uses `getPerformanceTimestamp()` for live manual trace
  timestamps and resolves serialized parents.
- `app/scripts/controllers/analytics/analytics.ts` flushes the queue after
  opt-in.

Before Step 1, the service used `Date.now()` for buffered defaults while live
manual traces used `getPerformanceTimestamp()`. Step 1 now uses the canonical
clock for both buffered defaults; the cross-consent lifecycle coverage remains
in Step 2.

This branch already preserves serialized `{ _name, _id }` parent contexts.
The implementation must keep the parent ID as well as the name because
onboarding journey traces use random IDs; name-only lookup can attach a child
to the wrong journey or fail to resolve it.

## Technical decisions

1. **Canonical clock:** Use `getPerformanceTimestamp()` for buffered and live
   manual trace timestamps. It produces epoch milliseconds compatible with
   Sentry span ingestion.
2. **Timestamp capture:** Stamp missing start/end timestamps when the request is
   buffered. Replay must use those recorded values; re-stamping at replay would
   change the measured duration.
3. **Parent identity:** Store a serializable parent descriptor containing
   `{ _name, _id }`, remove live Sentry objects from buffered requests, and
   restore the descriptor before calling `trace()` during replay.
4. **Scope:** Do not change onboarding UI, consent flow, persisted state, or
   dependencies.

## Reviewable implementation steps

Each step should be independently reviewable and testable.

### Step 0 — Baseline and scope [x]

- Confirm the queue owner and consent replay path.
- Confirm the existing parent resolver behavior.
- Run the focused baseline tests:

  ```bash
  yarn test:unit app/scripts/services/sentry/sentry-tracing-service.test.ts shared/lib/trace.test.ts --runInBand --watchman=false
  ```

**Baseline result:** 2 suites passed, 36 tests passed.

### Step 1 — Use the canonical clock for buffered defaults [x]

Update only `SentryTracingService` so missing buffered `startTime` and
`timestamp` values use `getPerformanceTimestamp()` instead of `Date.now()`.

Add focused tests proving:

- Buffered start timestamps come from the performance clock.
- Buffered end timestamps come from the performance clock.
- `Date.now()` is not used for these defaults.

**Review boundary:** one service source change plus its direct unit tests.

**Result:** `SentryTracingService` now stamps missing buffered start and end
timestamps with `getPerformanceTimestamp()`.

**Verification:** `sentry-tracing-service.test.ts` passed with 1 suite and
7 tests.

### Step 2 — Cover the cross-consent timing paths [x]

Add lifecycle tests for both acceptance-critical scenarios:

1. Buffered start → opt in and replay start → live end.
2. Buffered start + buffered end → opt in and replay both.

Assert that the Sentry start and end timestamps are from the same clock and
that `endTime >= startTime`.

**Review boundary:** tests and only the smallest production adjustment needed
to make the lifecycle behavior pass.

**Result:** Added service-level regression tests for buffered-start/live-end and
buffered-start/buffered-end replay. Both assert performance-clock timestamps
and non-negative durations.

**Verification:** `sentry-tracing-service.test.ts` passed with 1 suite and
9 tests.

### Step 3 — Verify parent reconnection during replay [ ]

Add a regression test using a non-default journey ID:

- Buffer a journey span.
- Buffer a child span with serialized `{ _name, _id }` parent context.
- Opt in and replay.
- Assert the child is started with the journey span as `parentSpan`.

If the existing serialized-parent implementation passes this test, no further
production change is required. If the implementation is changed to use a
`parentTraceName` field, it must also retain the parent ID.

**Review boundary:** parent-link regression test and any isolated buffering
normalization needed for it.

### Step 4 — Add shared trace timestamp coverage [ ]

Extend `shared/lib/trace.test.ts` only where needed to document the shared
contract:

- Default manual start uses `getPerformanceTimestamp()`.
- Default manual end uses `getPerformanceTimestamp()`.
- Explicit caller-provided timestamps remain unchanged.

Do not alter the callback trace logging timestamps unless the Sentry span
timestamp behavior is affected; `Date.now()` there is diagnostic logging, not
the manual span timestamp.

**Review boundary:** shared trace tests, with no unrelated trace refactoring.

### Step 5 — Final verification [ ]

- Run the focused trace tests.
- Run `yarn lint:changed:fix`.
- Run TypeScript linting for the changed files.
- Review the final diff for unrelated UI, migration, or dependency changes.

## Acceptance checklist

- [ ] No buffered/live span combines `Date.now()` and
  `getPerformanceTimestamp()` timestamps.
- [ ] Buffered-start/live-end produces a non-negative duration.
- [ ] Buffered-start/buffered-end replay produces a non-negative duration.
- [ ] Replayed buffered children are parented under the correct onboarding
  journey in Sentry.
- [ ] Existing opt-in, opt-out, and insertion-order behavior remains intact.

## Expected files

- `app/scripts/services/sentry/sentry-tracing-service.ts`
- `app/scripts/services/sentry/sentry-tracing-service.test.ts`
- `shared/lib/trace.test.ts`

No changes to `metametrics-controller.ts` are expected because buffering has
already moved to `SentryTracingService`.
