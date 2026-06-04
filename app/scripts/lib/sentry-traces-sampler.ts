/**
 * Sentry transaction sample rates keyed by transaction `name` (which, for our
 * custom `trace()` spans, is the `TraceName` / span description). A name listed
 * here is sampled at the given rate instead of the global `tracesSampleRate`, so
 * a single high-volume custom transaction can be capped without lowering
 * visibility into everything else.
 *
 * Seeded with the two assets-controller transactions that breached the Sentry
 * span quota in 13.32.0 (see #43211 / #43226). They are pinned to `0` so that if
 * the instrumentation is re-enabled — the controller `trace` callback was removed
 * in PR #43213 — these spans stay dropped until a deliberate, budgeted rate is
 * set here, or supplied per build/release via the `SENTRY_SAMPLE_RATE_OVERRIDES`
 * env var (declared in `builds.yml`).
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
   * Deprecated duplicate of `name` carried by older SDK shapes. Still populated
   * in `@sentry/types` 8.x (marked `@deprecated`, "will be removed eventually"),
   * so we read it as a fallback to stay robust across SDK version drift. Harmless
   * once the SDK drops it — the fallback simply resolves to `undefined`.
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
 * Resolve the effective sample rate for a single transaction.
 *
 * Pure decision function (no SDK access) so it can be unit-tested directly. A
 * name with an override is pinned to that rate, regardless of any parent
 * decision, so a throttled custom transaction can't ride in on a sampled parent
 * trace and re-breach the budget. Everything else inherits the head-of-trace
 * decision when there is one (so we don't split traces), otherwise falls back to
 * the global default rate.
 *
 * The transaction name is read from `name`, falling back to the deprecated
 * `transactionContext.name`, so the lookup is robust across SDK shapes.
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
 * `{ "<transaction name>": <rate 0..1> }`, inlined per build/release from
 * `builds.yml` (or `.metamaskprodrc` / CI). Absent or malformed yields no
 * overrides — defensive so a bad value can never break Sentry init.
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
 * Build the `tracesSampler` callback passed to `Sentry.init`.
 *
 * The override map is resolved once, when the SDK is configured, from the
 * built-in {@link DEFAULT_TRANSACTION_SAMPLE_RATES} merged with the build-time
 * `SENTRY_SAMPLE_RATE_OVERRIDES` env var (declared in `builds.yml`, settable per
 * release via CI / `.metamaskprodrc`). This is build-time: changing a rate still
 * requires a new build, not a runtime/remote toggle.
 *
 * @param options - Sampler options.
 * @param options.defaultSampleRate - Global fallback rate (the value that would
 * otherwise be passed as `tracesSampleRate`).
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
