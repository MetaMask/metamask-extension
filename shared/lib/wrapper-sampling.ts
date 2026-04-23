/**
 * Sub-sample rate for wrapper-created spans (`messenger.call`, `rpc.handler`).
 *
 * Applied as a second filter on top of `tracesSampleRate`: only this fraction of
 * sampled traces will record wrapper spans. Conservative starting point at 0.5%
 * caps wrapper-driven span volume to ~0.01-0.1% of pre-PR baseline ingest while
 * still yielding ~100K instrumented traces/day for production validation.
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
