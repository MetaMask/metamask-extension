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
};

type ControllerFlagState = {
  remoteFeatureFlags?: { sentry?: Record<string, unknown> };
};

let remoteRates: SentryRemoteRates = {};

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
 * Test-only reset of the cached rates.
 */
export function resetSentryRemoteRates(): void {
  remoteRates = {};
}

type PersistedStateHook = (options: {
  reportErrors: boolean;
}) => Promise<unknown>;

/**
 * Resolve once `globalThis.stateHooks.getPersistedState` is registered.
 *
 * `setup-initial-state-hooks` registers the hook synchronously at module
 * evaluation, but that module loads *after* `sentry-install` invokes
 * `applySentryRemoteRates`, so the hook is absent for the first ticks of a
 * session. Without this wait the read optional-chains through an undefined
 * hook and silently falls back to the compile-time rate — the remote flag
 * would never apply. Poll briefly instead, then give up to the fallback.
 *
 * @param attempts - Max poll attempts before giving up.
 * @param intervalMs - Delay between attempts.
 * @returns The hook once available, or undefined if it never registers.
 */
async function waitForPersistedStateHook(
  attempts = 50,
  intervalMs = 100,
): Promise<PersistedStateHook | undefined> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    const hook = globalThis.stateHooks?.getPersistedState;
    if (typeof hook === 'function') {
      return hook as PersistedStateHook;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return undefined;
}

/**
 * Reads the `sentry` remote feature flag from persisted state and applies
 * valid overrides: `tracesSampleRate` onto the live client's options (the
 * sampler consults options per event, so a post-init update takes effect
 * without re-init), `wrapperSampleRate` into the module cache consumed by
 * `shouldSampleWrappers`.
 *
 * Read once, after waiting for the persisted-state hook to register (see
 * {@link waitForPersistedStateHook}): no per-call lookups afterward.
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
    const getPersistedState = await waitForPersistedStateHook();
    if (!getPersistedState) {
      // State hooks never registered: compile-time fallbacks apply.
      return {};
    }
    const persistedState = (await getPersistedState({
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
  };
  remoteRates = applied;

  if (client && applied.tracesSampleRate !== undefined) {
    client.getOptions().tracesSampleRate = applied.tracesSampleRate;
  }
  return applied;
}
