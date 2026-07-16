/**
 * Remote-flag-driven Sentry sample rates.
 *
 * Both `tracesSampleRate` and `WRAPPER_SAMPLE_RATE` are compile-time
 * constants, so changing either requires a release train plus population
 * rollover (roughly weeks). This module reads overrides from the persisted
 * `RemoteFeatureFlagController` state once at Sentry init, letting sampling
 * react to quota pressure or validation step-ups without a build.
 *
 * The compile-time constants remain the fallbacks whenever the flag is
 * absent or malformed. The schema is an extensible object
 * (`sentry: { tracesSampleRate, wrapperSampleRate, ... }`) so later rates
 * (`transactionSampleRates`, `propagationSampleRate`) add keys without a
 * breaking change.
 */

export type SentryRemoteRates = {
  tracesSampleRate?: number;
  wrapperSampleRate?: number;
  transactionSampleRates?: Record<string, number>;
};

type ControllerFlagState = {
  remoteFeatureFlags?: { sentry?: Record<string, unknown> };
};

let remoteRates: SentryRemoteRates = {};

/**
 * Validate a per-transaction-name rate map: keep only entries whose value is a
 * valid rate. A non-object, an empty result, or no valid entries yields
 * undefined so the build-time overrides apply unchanged.
 *
 * @param value - Candidate map from the remote flag.
 * @returns The validated map, or undefined when invalid or empty.
 */
function asValidRateMap(value: unknown): Record<string, number> | undefined {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return undefined;
  }
  const rates: Record<string, number> = {};
  for (const [name, rate] of Object.entries(value)) {
    const validRate = asValidRate(rate);
    if (validRate !== undefined) {
      rates[name] = validRate;
    }
  }
  return Object.keys(rates).length > 0 ? rates : undefined;
}

/**
 * A valid rate is a finite number in [0, 1]; anything else is treated as
 * absent so the compile-time fallback applies.
 *
 * @param value - Candidate rate from the remote flag.
 * @returns The rate, or undefined when invalid.
 */
function asValidRate(value: unknown): number | undefined {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
    ? value
    : undefined;
}

/**
 * The remote `wrapperSampleRate` override, when a valid one was read at init.
 *
 * @returns The override, or undefined so callers fall back to the constant.
 */
export function getRemoteWrapperSampleRate(): number | undefined {
  return remoteRates.wrapperSampleRate;
}

/**
 * The remote per-transaction-name sample-rate overrides
 * (`sentry.transactionSampleRates`), when a valid map was read at init.
 * Consumed by the `tracesSampler` ahead of the build-time per-name overrides,
 * so a newly-noisy custom transaction can be re-budgeted without a build.
 *
 * @returns The validated name -> rate map, or undefined when absent.
 */
export function getRemoteTransactionSampleRates():
  | Record<string, number>
  | undefined {
  return remoteRates.transactionSampleRates;
}

/**
 * The remote `tracesSampleRate` override, when a valid one was read at init.
 * Consumed by the `tracesSampler` as both the default rate and a hard ceiling
 * across all transactions (the release-level emergency throttle).
 *
 * @returns The override, or undefined so callers fall back to the build-time rate.
 */
export function getRemoteTracesSampleRate(): number | undefined {
  return remoteRates.tracesSampleRate;
}

/**
 * Test-only reset of the cached rates.
 */
export function resetSentryRemoteRates(): void {
  remoteRates = {};
}

/**
 * Reads the `sentry` remote feature flag from persisted state and applies
 * valid overrides: `tracesSampleRate` onto the live client's options (the
 * sampler consults options per event, so a post-init update takes effect
 * without re-init), `wrapperSampleRate` into the module cache consumed by
 * `shouldSampleWrappers`.
 *
 * Read once at init by design: no per-call lookups afterward.
 *
 * @param client - The initialized Sentry client, when available.
 * @param client.getOptions
 * @returns The rates that were applied.
 */
export async function applySentryRemoteRates(client?: {
  getOptions: () => { tracesSampleRate?: number };
}): Promise<SentryRemoteRates> {
  let sentryFlag: Record<string, unknown> | undefined;
  try {
    const persistedState = (await globalThis.stateHooks?.getPersistedState?.({
      reportErrors: false,
    })) as
      | { data?: Record<string, ControllerFlagState | undefined> }
      | undefined;
    sentryFlag =
      persistedState?.data?.RemoteFeatureFlagController?.remoteFeatureFlags
        ?.sentry;
  } catch {
    // Persisted state unavailable (fresh install, storage error): fallbacks apply.
    return {};
  }

  const applied: SentryRemoteRates = {
    tracesSampleRate: asValidRate(sentryFlag?.tracesSampleRate),
    wrapperSampleRate: asValidRate(sentryFlag?.wrapperSampleRate),
    transactionSampleRates: asValidRateMap(sentryFlag?.transactionSampleRates),
  };
  remoteRates = applied;

  if (client && applied.tracesSampleRate !== undefined) {
    client.getOptions().tracesSampleRate = applied.tracesSampleRate;
  }
  return applied;
}
