/**
 * Sub-sample rate for wrapper-created spans (`messenger.call`, `rpc.handler`).
 *
 * Applied as a second filter on top of `tracesSampleRate`: only this fraction of
 * sampled traces will record wrapper spans. Conservative starting point at 0.5%
 * caps wrapper-driven span volume to ~0.001-0.3% of pre-PR baseline ingest while
 * still yielding ~105K instrumented traces/day for production validation.
 *
 * Step-up candidate: 5% (W=0.05) once the `isReadOnlyAction` denylist is
 * confirmed effective in production. The denylist removes ~90% of the
 * originally-projected per-trace wrapper-span volume (~100 spans → ~10-20),
 * leaving ~10× headroom against the original conservative ceiling.
 */
const WRAPPER_SAMPLE_RATE = 0.005;

/**
 * Deterministic per-trace sub-sampling decision for wrapper spans.
 *
 * Returns the same answer for the same `traceId`, so all wrapper spans within
 * a single trace are either all recorded or all skipped. This produces clean
 * trace waterfalls (no partial gaps) while reducing aggregate span volume.
 *
 * @param traceId - The Sentry trace ID (32-char hex string).
 * @returns true if wrapper spans should be created for this trace.
 */
export function shouldSampleWrappers(traceId: string | undefined): boolean {
  if (!traceId || traceId.length < 8) {
    return false;
  }
  const hashBucket = parseInt(traceId.slice(0, 8), 16) % 10000;
  return hashBucket < WRAPPER_SAMPLE_RATE * 10000;
}
