import { getRemoteWrapperSampleRate } from './sentry-remote-rates';

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
 *
 * The remote `sentry.wrapperSampleRate` feature flag overrides this constant
 * when a valid value was read at Sentry init (see sentry-remote-rates.ts);
 * this constant remains the fallback.
 */
const WRAPPER_SAMPLE_RATE = 0.005;

const admittedTraceIds = new Set<string>();

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
  if (admittedTraceIds.has(traceId)) {
    return true;
  }
  const rate = getRemoteWrapperSampleRate() ?? WRAPPER_SAMPLE_RATE;
  const hashBucket = parseInt(traceId.slice(0, 8), 16) % 10000;
  return hashBucket < rate * 10000;
}

/**
 * Sub-sampling decision for a wrapper span that starts its own trace, which has
 * no trace id to hash yet. Uses the same rate as {@link shouldSampleWrappers}.
 *
 * @param random - Returns a uniform number in [0, 1).
 * @returns true if the root wrapper span should be created.
 */
export function shouldSampleRootWrapper(
  random: () => number = Math.random,
): boolean {
  if (process.env.SENTRY_DISTRIBUTED_TRACING_DISABLED) {
    return false;
  }
  const rate = getRemoteWrapperSampleRate() ?? WRAPPER_SAMPLE_RATE;
  return random() < rate;
}

// A root wrapper is sampled before its trace id exists, so its nested wrappers
// cannot reach the same decision by hashing that id. Admit them while it runs.
export async function admitTraceWrappers<Result>(
  traceId: string | undefined,
  fn: () => Result | Promise<Result>,
): Promise<Result> {
  if (!traceId) {
    return await fn();
  }
  admittedTraceIds.add(traceId);
  try {
    return await fn();
  } finally {
    admittedTraceIds.delete(traceId);
  }
}
