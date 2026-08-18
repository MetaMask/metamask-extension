import {
  getRemoteTracesSampleRate,
  getRemoteTransactionSampleRates,
} from '../../../shared/lib/sentry-remote-rates';

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
   * The transaction name. Required on Sentry's own `SamplingContext`; optional
   * here so the sampler cannot throw on an unexpected call shape.
   */
  name?: string;
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
   * Per-name overrides, e.g. {@link DEFAULT_TRANSACTION_SAMPLE_RATES}. Read-only
   * because callers may pass the frozen constant itself rather than a copy.
   */
  sampleRateOverrides: Readonly<Record<string, number>>;
  /**
   * Per-name overrides from the remote `sentry.transactionSampleRates` flag;
   * consulted before {@link sampleRateOverrides} so a remote value wins over
   * the build-time one for the same transaction name.
   */
  remoteSampleRateOverrides?: Record<string, number>;
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
 * of parent, so a throttled transaction can't ride in on a sampled parent), with
 * a remote override winning over the build-time one; else inherit the parent
 * decision; else the default. Every non-zero result is capped by
 * `sampleRateCeiling`.
 *
 * Deliberately has no notion of releases. Silencing a specific release is a
 * fleet-wide selection over builds, and a build can only ever match itself — so
 * it belongs elsewhere: the remote `sentry` flag's `versions` ladder, which
 * `RemoteFeatureFlagController` resolves against the build's own version before
 * the rates reach this module, or a Sentry release inbound filter at ingest.
 * The config service does no version selection of its own.
 *
 * @param samplingContext - The (subset of the) Sentry sampling context.
 * @param options - Default rate, per-name overrides, and the ceiling.
 * @param options.defaultSampleRate - Rate applied to transactions with no
 * per-name override.
 * @param options.sampleRateOverrides - Build-time per-name sample-rate overrides.
 * @param options.remoteSampleRateOverrides - Remote-flag per-name overrides;
 * win over the build-time ones.
 * @param options.sampleRateCeiling - Hard ceiling capping every non-zero path.
 * @returns A sample rate — in [0, 1] for valid inputs; negative inputs and a
 * `sampleRateCeiling` above 1 are passed through unclamped.
 */
export function getTransactionSampleRate(
  samplingContext: TransactionSamplingContext,
  {
    defaultSampleRate,
    sampleRateOverrides,
    remoteSampleRateOverrides,
    sampleRateCeiling,
  }: SampleRateOptions,
): number {
  const ceiling = sampleRateCeiling ?? 1;

  const { parentSampled, name } = samplingContext ?? {};

  if (name !== undefined) {
    if (
      remoteSampleRateOverrides &&
      Object.prototype.hasOwnProperty.call(remoteSampleRateOverrides, name)
    ) {
      return Math.min(remoteSampleRateOverrides[name], ceiling);
    }
    if (Object.prototype.hasOwnProperty.call(sampleRateOverrides, name)) {
      return Math.min(sampleRateOverrides[name], ceiling);
    }
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
 * (see sentry-remote-rates.ts), which also acts as the ceiling — see
 * {@link getTransactionSampleRate} for the precedence and the release note.
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
  // Do not collapse to an unconditional call or spread. When unset the env var
  // inlines to a falsy literal (`builds.yml` defaults it to `null`), so this
  // branch and the unexported `parseSampleRateOverridesEnv` drop out of the
  // build entirely.
  const sampleRateOverrides: Readonly<Record<string, number>> = process.env
    .SENTRY_SAMPLE_RATE_OVERRIDES
    ? {
        ...DEFAULT_TRANSACTION_SAMPLE_RATES,
        ...parseSampleRateOverridesEnv(
          process.env.SENTRY_SAMPLE_RATE_OVERRIDES,
        ),
      }
    : DEFAULT_TRANSACTION_SAMPLE_RATES;

  return (samplingContext) => {
    // Read per call so a remote value applied after `Sentry.init` takes effect
    // without rebuilding the sampler; the read is a cached module field, not a
    // storage lookup. The same value is passed as BOTH default and ceiling, so
    // those two paths only diverge on a per-name override — which is why the
    // ceiling has to be isolated with one.
    const remoteRate = getRemoteTracesSampleRate();
    return getTransactionSampleRate(samplingContext, {
      defaultSampleRate: remoteRate ?? defaultSampleRate,
      sampleRateOverrides,
      remoteSampleRateOverrides: getRemoteTransactionSampleRates(),
      sampleRateCeiling: remoteRate,
    });
  };
}
