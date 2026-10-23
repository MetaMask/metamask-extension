# Initial Unlock readiness

`registerUnlockMeasurement` runs during UI startup, before React renders. It
registers only when the initial wallet state is onboarded and locked, and the
router starts at `/` or `/unlock`. State is the initial background snapshot, not
necessarily the state at the exact document navigation instant.

The adapter observes navigation even before the lazy page mounts. It accepts the
authentication redirect from the original `/` entry to `/unlock`, identified by
`REPLACE` and the original entry in `state.from`. Replaying that redirect under
StrictMode is allowed. Other navigation permanently discards the measurement;
returning to Unlock cannot restart it. Navigation observation stops when the page
reports or discards its measurement.

The handle reaches the page through `UnlockMeasurementContext`. The password
form uses the local `UnlockReady` marker; the passkey form calls `useAfterPaint`
directly. Both wait for an idle, onboarded form without lockout, submission, or
a blocking modal. No password input or network refresh is required.

Starting automatic passkey authentication explicitly discards the measurement
for every outcome, including failure, cancellation, and password fallback.
The existing `AppUnlocked` event measures authentication duration. Manual passkey
authentication and its troubleshooting modal temporarily suppress readiness.

The shared [measurement API](../../../docs/useful-screen-ready.md) owns document
visibility, elapsed time, and reporting. Unlock owns registration, navigation,
and its readiness decisions. The initial rollout instruments only this page.
