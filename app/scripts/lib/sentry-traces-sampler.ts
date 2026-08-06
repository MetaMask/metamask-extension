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
};

/**
 * Resolve the effective sample rate for one transaction. Pure (no SDK access)
 * for direct unit testing. Order: a per-name override pins its rate (regardless
 * of parent, so a throttled transaction can't ride in on a sampled parent); else
 * inherit the parent decision; else the default. Name reads from `name` or
 * `transactionContext.name`.
 *
 * Deliberately has no notion of releases. Silencing a specific release is a
 * fleet-wide selection over builds, and a build can only ever match itself — so
 * it belongs to whatever sees the fleet: the remote `sentry` flag scoped by
 * `clientVersion` at config-serve time, or a Sentry release inbound filter at
 * ingest. See the removal rationale on #43228.
 *
 * @param samplingContext - The (subset of the) Sentry sampling context.
 * @param options - Default rate and per-name overrides.
 * @param options.defaultSampleRate - Rate applied to transactions with no
 * per-name override.
 * @param options.sampleRateOverrides - Per-name sample-rate overrides.
 * @returns A sample rate in the range [0, 1].
 */
export function getTransactionSampleRate(
  samplingContext: TransactionSamplingContext,
  { defaultSampleRate, sampleRateOverrides }: SampleRateOptions,
): number {
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
    return sampleRateOverrides[name];
  }

  if (typeof parentSampled === 'boolean') {
    return parentSampled ? 1 : 0;
  }

  return defaultSampleRate;
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
 * `SENTRY_SAMPLE_RATE_OVERRIDES` env var — build-time only; changing a rate needs
 * a new build, not a runtime toggle.
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

  return (samplingContext) =>
    getTransactionSampleRate(samplingContext, {
      defaultSampleRate,
      sampleRateOverrides,
    });
}
