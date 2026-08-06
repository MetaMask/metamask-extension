import { getRemoteTracesSampleRate } from '../../../shared/lib/sentry-remote-rates';

/**
 * Per-`name` sample rates that override the global `tracesSampleRate`, so a
 * high-volume custom transaction can be capped without lowering visibility
 * elsewhere. Seeded with the two assets-controller transactions pinned to `0`.
 */
export const DEFAULT_TRANSACTION_SAMPLE_RATES: Readonly<
  Record<string, number>
> = Object.freeze({
  AssetsDataSourceTiming: 0,
  AssetsUpdatePipeline: 0,
});

/**
 * The subset of Sentry's `SamplingContext` that the sampler depends on.
 */
export type TransactionSamplingContext = {
  /**
   * The transaction name (current Sentry field, top-level on `SamplingContext`).
   */
  name?: string;
  /**
   * Deprecated duplicate of `name` on older SDK shapes; read as a fallback for
   * version drift.
   */
  transactionContext?: { name?: string };
  /**
   * Whether the head-of-trace sampling decision was positive.
   */
  parentSampled?: boolean;
};

type SampleRateOptions = {
  /**
   * Rate applied to transactions with no per-name override.
   */
  defaultSampleRate: number;
  /**
   * Per-name overrides, e.g. {@link DEFAULT_TRANSACTION_SAMPLE_RATES}.
   */
  sampleRateOverrides: Record<string, number>;
  /**
   * Hard ceiling applied across ALL transactions — caps per-name overrides and
   * parent-sampled (`forceTransaction`) decisions, not just the default — so a
   * remote throttle guarantees the shed. Absent means no ceiling.
   */
  sampleRateCeiling?: number;
};

/**
 * Resolve the effective sample rate for one transaction. Pure (no SDK access)
 * for direct unit testing. Order: a per-name override pins its rate (regardless
 * of parent, so a throttled transaction can't ride in on a sampled parent); else
 * inherit the parent decision; else the default. Every non-zero result is capped
 * by `sampleRateCeiling`. Name reads from `name` or `transactionContext.name`.
 *
 * Deliberately has no notion of releases. Silencing a specific release is a
 * fleet-wide selection over builds, and a build can only ever match itself — so
 * it belongs to whatever sees the fleet: the remote `sentry` flag scoped by
 * `clientVersion` at config-serve time, or a Sentry release inbound filter at
 * ingest. See the removal rationale on #43228.
 *
 * @param samplingContext - The (subset of the) Sentry sampling context.
 * @param options - Default rate, per-name overrides, and the ceiling.
 * @param options.defaultSampleRate - Rate applied to transactions with no
 * per-name override.
 * @param options.sampleRateOverrides - Per-name sample-rate overrides.
 * @param options.sampleRateCeiling - Hard ceiling capping every non-zero path.
 * @returns A sample rate in the range [0, 1].
 */
export function getTransactionSampleRate(
  samplingContext: TransactionSamplingContext,
  {
    defaultSampleRate,
    sampleRateOverrides,
    sampleRateCeiling,
  }: SampleRateOptions,
): number {
  const ceiling = sampleRateCeiling ?? 1;

  const { parentSampled } = samplingContext ?? {};
  // Prefer the current top-level `name`; fall back to the deprecated-but-still-
  // populated `transactionContext.name` so the sampler works regardless of which
  // field a given SDK version sets.
  const name =
    samplingContext?.name ?? samplingContext?.transactionContext?.name;

  if (
    name !== undefined &&
    Object.prototype.hasOwnProperty.call(sampleRateOverrides, name)
  ) {
    return Math.min(sampleRateOverrides[name], ceiling);
  }

  if (typeof parentSampled === 'boolean') {
    return parentSampled ? Math.min(1, ceiling) : 0;
  }

  return Math.min(defaultSampleRate, ceiling);
}

/**
 * Parse the build-time `SENTRY_SAMPLE_RATE_OVERRIDES` env var: a JSON object of
 * `{ "<transaction name>": <rate 0..1> }`. Absent/malformed yields no overrides
 * (defensive: a bad value can't break Sentry init).
 *
 * @param raw - The raw env-var string, if any.
 * @returns A validated name -> rate map; entries with non-numeric or
 * out-of-[0,1] values are dropped.
 */
function parseSampleRateOverridesEnv(
  raw: string | undefined,
): Record<string, number> {
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) {
      return {};
    }
    const overrides: Record<string, number> = {};
    for (const [name, rate] of Object.entries(parsed)) {
      if (typeof rate === 'number' && rate >= 0 && rate <= 1) {
        overrides[name] = rate;
      }
    }
    return overrides;
  } catch {
    return {};
  }
}

/**
 * Build the `tracesSampler` callback passed to `Sentry.init`. Resolves the
 * per-name overrides once, merging the built-in defaults with the build-time
 * `SENTRY_SAMPLE_RATE_OVERRIDES` env var. The global rate is additionally
 * overridable at runtime by the remote `sentry.tracesSampleRate` feature flag
 * (see sentry-remote-rates.ts), which acts as a hard ceiling across all
 * transactions — the release-level emergency throttle. Targeting a specific
 * release is done by scoping that flag (`clientVersion`), not by anything in
 * this module.
 *
 * @param options - Sampler options.
 * @param options.defaultSampleRate - Global fallback rate (the `tracesSampleRate`).
 * @returns A Sentry `tracesSampler` callback.
 */
export function createTracesSampler({
  defaultSampleRate,
}: {
  defaultSampleRate: number;
}): (samplingContext: TransactionSamplingContext) => number {
  const sampleRateOverrides: Record<string, number> = {
    ...DEFAULT_TRANSACTION_SAMPLE_RATES,
    ...parseSampleRateOverridesEnv(process.env.SENTRY_SAMPLE_RATE_OVERRIDES),
  };

  return (samplingContext) => {
    // Read per call so a remote value applied after `Sentry.init` takes effect
    // without rebuilding the sampler; the read is a cached module field, not a
    // storage lookup. The remote rate is both the default AND a hard ceiling:
    // the release-level emergency throttle must cap per-name overrides and
    // parent-sampled decisions too, or the shed is not guaranteed.
    const remoteRate = getRemoteTracesSampleRate();
    return getTransactionSampleRate(samplingContext, {
      defaultSampleRate: remoteRate ?? defaultSampleRate,
      sampleRateOverrides,
      sampleRateCeiling: remoteRate,
    });
  };
}
