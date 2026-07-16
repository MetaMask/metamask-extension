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
 * Releases dropped wholesale: when the build's own release matches, the sampler
 * returns `0` for every transaction (regardless of name/parent/default). Only
 * affects a build's OWN release — it cannot reach already-installed builds of a
 * dropped release; those need a forced-update drain.
 */
export const DEFAULT_DROPPED_RELEASES: readonly string[] = Object.freeze([
  '13.32.0',
  '13.32.1',
  '13.33.0',
]);

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
   * Per-name overrides from the remote `sentry.transactionSampleRates` flag;
   * consulted before {@link sampleRateOverrides} so a remote value wins over
   * the build-time one for the same transaction name.
   */
  remoteSampleRateOverrides?: Record<string, number>;
  /**
   * This build's OWN release (bare version, e.g. `'13.32.0'`), not a
   * per-transaction value. When in {@link droppedReleases}, every transaction is
   * dropped.
   */
  release?: string;
  /**
   * Releases dropped wholesale (see {@link DEFAULT_DROPPED_RELEASES}). When the
   * build's {@link release} is a member, the sampler returns `0` for everything.
   */
  droppedReleases?: ReadonlySet<string>;
  /**
   * Hard ceiling applied across ALL transactions — caps per-name overrides and
   * parent-sampled (`forceTransaction`) decisions, not just the default — so a
   * remote throttle guarantees the shed. Absent means no ceiling.
   */
  sampleRateCeiling?: number;
};

/**
 * Resolve the effective sample rate for one transaction. Pure (no SDK access)
 * for direct unit testing. Order: a dropped `release` kills everything; else a
 * per-name override pins its rate (regardless of parent, so a throttled
 * transaction can't ride in on a sampled parent), with a remote override
 * winning over the build-time one; else inherit the parent decision; else the
 * default. Name reads from `name` or `transactionContext.name`.
 *
 * @param samplingContext - The (subset of the) Sentry sampling context.
 * @param options - Default rate, per-name overrides, and release-drop config.
 * @param options.defaultSampleRate - Rate applied to transactions with no
 * per-name override.
 * @param options.sampleRateOverrides - Build-time per-name sample-rate overrides.
 * @param options.remoteSampleRateOverrides - Remote-flag per-name overrides;
 * win over the build-time ones.
 * @param options.release - This build's own release (bare version).
 * @param options.droppedReleases - Releases dropped wholesale.
 * @param options.sampleRateCeiling - Hard ceiling capping every non-zero path.
 * @returns A sample rate in the range [0, 1].
 */
export function getTransactionSampleRate(
  samplingContext: TransactionSamplingContext,
  {
    defaultSampleRate,
    sampleRateOverrides,
    remoteSampleRateOverrides,
    release,
    droppedReleases,
    sampleRateCeiling,
  }: SampleRateOptions,
): number {
  const ceiling = sampleRateCeiling ?? 1;
  // Whole-release kill: if this build's own release is dropped, sample nothing.
  // Checked first so it wins over name overrides, parentSampled, and default.
  if (release !== undefined && droppedReleases?.has(release)) {
    return 0;
  }

  const { parentSampled } = samplingContext ?? {};
  // Prefer the current top-level `name`; fall back to the deprecated-but-still-
  // populated `transactionContext.name` so the sampler works regardless of which
  // field a given SDK version sets.
  const name =
    samplingContext?.name ?? samplingContext?.transactionContext?.name;

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
 * Parse the build-time `SENTRY_DROP_RELEASES` env var: comma-separated bare
 * versions (e.g. `"13.32.0,13.33.0"`), merged over {@link DEFAULT_DROPPED_RELEASES}.
 * Absent/empty yields none (defensive: a bad value can't break Sentry init).
 *
 * @param raw - The raw env-var string, if any.
 * @returns The list of release versions, trimmed, with empties dropped.
 */
export function parseDroppedReleasesEnv(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }
  return raw
    .split(',')
    .map((release) => release.trim())
    .filter((release) => release.length > 0);
}

/**
 * Build the `tracesSampler` callback passed to `Sentry.init`. Resolves the
 * per-name overrides and dropped-release set once, merging the built-in defaults
 * with the build-time `SENTRY_SAMPLE_RATE_OVERRIDES` / `SENTRY_DROP_RELEASES` env
 * vars. The global rate is additionally overridable at runtime by the remote
 * `sentry.tracesSampleRate` feature flag (see sentry-remote-rates.ts), which
 * acts as a hard ceiling across all transactions — the release-level emergency
 * throttle (target the flag at the over-quota release; healthy releases keep
 * their build-time rates).
 *
 * @param options - Sampler options.
 * @param options.defaultSampleRate - Global fallback rate (the `tracesSampleRate`).
 * @param options.release - This build's own bare release (e.g. `'13.32.0'`), not
 * the full `metamask-extension@x.y.z` string.
 * @returns A Sentry `tracesSampler` callback.
 */
export function createTracesSampler({
  defaultSampleRate,
  release,
}: {
  defaultSampleRate: number;
  release?: string;
}): (samplingContext: TransactionSamplingContext) => number {
  const sampleRateOverrides: Record<string, number> = {
    ...DEFAULT_TRANSACTION_SAMPLE_RATES,
    ...parseSampleRateOverridesEnv(process.env.SENTRY_SAMPLE_RATE_OVERRIDES),
  };

  const droppedReleases = new Set<string>([
    ...DEFAULT_DROPPED_RELEASES,
    ...parseDroppedReleasesEnv(process.env.SENTRY_DROP_RELEASES),
  ]);

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
      remoteSampleRateOverrides: getRemoteTransactionSampleRates(),
      release,
      droppedReleases,
      sampleRateCeiling: remoteRate,
    });
  };
}
