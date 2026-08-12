import {
  applySentryRemoteRates,
  resetSentryRemoteRates,
} from '../../../shared/lib/sentry-remote-rates';
import {
  DEFAULT_TRANSACTION_SAMPLE_RATES,
  createTracesSampler,
  getTransactionSampleRate,
} from './sentry-traces-sampler';

describe('getTransactionSampleRate', () => {
  const defaultSampleRate = 0.0075;
  const sampleRateOverrides = {
    'Dropped Transaction': 0,
    'Sub-Sampled Transaction': 0.01,
  };

  it('pins a throttled transaction to its configured rate', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Dropped Transaction' },
        { defaultSampleRate, sampleRateOverrides },
      ),
    ).toBe(0);
  });

  it('returns a non-zero override rate verbatim', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Sub-Sampled Transaction' },
        { defaultSampleRate, sampleRateOverrides },
      ),
    ).toBe(0.01);
  });

  it('applies the override regardless of the parent sampling decision', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Dropped Transaction', parentSampled: true },
        { defaultSampleRate, sampleRateOverrides },
      ),
    ).toBe(0);
    expect(
      getTransactionSampleRate(
        { name: 'Dropped Transaction', parentSampled: false },
        { defaultSampleRate, sampleRateOverrides },
      ),
    ).toBe(0);
  });

  it('inherits a positive parent decision for non-throttled transactions', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Unlisted Transaction', parentSampled: true },
        { defaultSampleRate, sampleRateOverrides },
      ),
    ).toBe(1);
  });

  it('inherits a negative parent decision for non-throttled transactions', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Unlisted Transaction', parentSampled: false },
        { defaultSampleRate, sampleRateOverrides },
      ),
    ).toBe(0);
  });

  it('falls back to the default rate for a root, non-throttled transaction', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Unlisted Transaction' },
        { defaultSampleRate, sampleRateOverrides },
      ),
    ).toBe(defaultSampleRate);
  });

  it('falls back to the default rate when no name is present', () => {
    expect(
      getTransactionSampleRate({}, { defaultSampleRate, sampleRateOverrides }),
    ).toBe(defaultSampleRate);
  });

  it('is a safe no-op with an empty override map', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Dropped Transaction' },
        { defaultSampleRate, sampleRateOverrides: {} },
      ),
    ).toBe(defaultSampleRate);
  });
});

describe('createTracesSampler', () => {
  const defaultSampleRate = 0.0075;
  const originalEnv = process.env.SENTRY_SAMPLE_RATE_OVERRIDES;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.SENTRY_SAMPLE_RATE_OVERRIDES;
    } else {
      process.env.SENTRY_SAMPLE_RATE_OVERRIDES = originalEnv;
    }
  });

  it('uses the default rate for a transaction with no override', () => {
    delete process.env.SENTRY_SAMPLE_RATE_OVERRIDES;
    const sampler = createTracesSampler({ defaultSampleRate });

    expect(sampler({ name: 'Unlisted Transaction' })).toBe(defaultSampleRate);
  });

  it('applies the built-in default overrides', () => {
    delete process.env.SENTRY_SAMPLE_RATE_OVERRIDES;
    const sampler = createTracesSampler({ defaultSampleRate });

    // Driven off the map itself so the test tracks the configured policy rather
    // than any specific transaction name that happens to be throttled today.
    for (const [name, rate] of Object.entries(
      DEFAULT_TRANSACTION_SAMPLE_RATES,
    )) {
      expect(sampler({ name })).toBe(rate);
    }
  });

  it('throttles a transaction supplied purely via the env override', () => {
    process.env.SENTRY_SAMPLE_RATE_OVERRIDES = JSON.stringify({
      'Flagged Transaction': 0,
    });

    const sampler = createTracesSampler({ defaultSampleRate });

    expect(sampler({ name: 'Flagged Transaction' })).toBe(0);
  });

  it('merges env overrides on top of the built-in defaults', () => {
    process.env.SENTRY_SAMPLE_RATE_OVERRIDES = JSON.stringify({
      'Flagged Transaction': 0.001,
    });

    const sampler = createTracesSampler({ defaultSampleRate });

    // Env-supplied override is applied...
    expect(sampler({ name: 'Flagged Transaction' })).toBe(0.001);
    // ...without dropping the built-in defaults (merge, not replace).
    for (const [name, rate] of Object.entries(
      DEFAULT_TRANSACTION_SAMPLE_RATES,
    )) {
      expect(sampler({ name })).toBe(rate);
    }
  });

  it('lets an env override win over a built-in default rate', () => {
    const seededNames = Object.keys(DEFAULT_TRANSACTION_SAMPLE_RATES);
    // Precedence is only observable while there are seeded defaults to override.
    if (seededNames.length === 0) {
      return;
    }
    const [name] = seededNames;
    process.env.SENTRY_SAMPLE_RATE_OVERRIDES = JSON.stringify({ [name]: 0.5 });

    const sampler = createTracesSampler({ defaultSampleRate });

    expect(sampler({ name })).toBe(0.5);
  });

  it('ignores a malformed env override (safe no-op, keeps defaults)', () => {
    process.env.SENTRY_SAMPLE_RATE_OVERRIDES = 'not-json{';

    const sampler = createTracesSampler({ defaultSampleRate });

    expect(sampler({ name: 'Unlisted Transaction' })).toBe(defaultSampleRate);
    for (const [name, rate] of Object.entries(
      DEFAULT_TRANSACTION_SAMPLE_RATES,
    )) {
      expect(sampler({ name })).toBe(rate);
    }
  });
});

describe('sample-rate ceiling (emergency throttle)', () => {
  const defaultSampleRate = 0.0075;
  const sampleRateOverrides = {
    'Dropped Transaction': 0,
    'Sub-Sampled Transaction': 0.01,
    'Boosted Transaction': 0.5,
  };
  const ceilingOptions = {
    defaultSampleRate,
    sampleRateOverrides,
    sampleRateCeiling: 0.005,
  };

  it('caps a higher per-name override at the ceiling', () => {
    expect(
      getTransactionSampleRate({ name: 'Boosted Transaction' }, ceilingOptions),
    ).toBe(0.005);
  });

  it('leaves a per-name override below the ceiling untouched', () => {
    expect(
      getTransactionSampleRate({ name: 'Dropped Transaction' }, ceilingOptions),
    ).toBe(0);
  });

  it('caps a positive parent decision (forceTransaction path) at the ceiling', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Unlisted Transaction', parentSampled: true },
        ceilingOptions,
      ),
    ).toBe(0.005);
  });

  it('does not resurrect a negative parent decision', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Unlisted Transaction', parentSampled: false },
        ceilingOptions,
      ),
    ).toBe(0);
  });

  it('caps the default rate at the ceiling', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Unlisted Transaction' },
        ceilingOptions,
      ),
    ).toBe(0.005);
  });

  it('is a no-op when the ceiling is above every configured rate', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Boosted Transaction' },
        { ...ceilingOptions, sampleRateCeiling: 1 },
      ),
    ).toBe(0.5);
  });
});

describe('createTracesSampler with the remote tracesSampleRate flag', () => {
  const defaultSampleRate = 0.0075;

  async function applyRemoteTracesSampleRate(rate: number) {
    globalThis.stateHooks = {
      getPersistedState: async () => ({
        data: {
          RemoteFeatureFlagController: {
            remoteFeatureFlags: { sentry: { tracesSampleRate: rate } },
          },
        },
      }),
      getSentryState: () => ({ browser: '', version: '' }),
    };
    await applySentryRemoteRates();
  }

  afterEach(() => {
    resetSentryRemoteRates();
    // @ts-expect-error test cleanup of the global hook
    delete globalThis.stateHooks;
    delete process.env.SENTRY_SAMPLE_RATE_OVERRIDES;
  });

  it('uses the remote rate as the default for unlisted transactions', async () => {
    const sampler = createTracesSampler({ defaultSampleRate });
    await applyRemoteTracesSampleRate(0.001);

    expect(sampler({ name: 'Unlisted Transaction' })).toBe(0.001);
  });

  it('takes effect on a sampler built before the flag resolved (post-init apply)', async () => {
    const sampler = createTracesSampler({ defaultSampleRate });

    expect(sampler({ name: 'Unlisted Transaction' })).toBe(defaultSampleRate);
    await applyRemoteTracesSampleRate(0.001);
    expect(sampler({ name: 'Unlisted Transaction' })).toBe(0.001);
  });

  it('caps a build-time per-name override at the remote ceiling', async () => {
    process.env.SENTRY_SAMPLE_RATE_OVERRIDES = JSON.stringify({
      'Boosted Transaction': 0.5,
    });
    const sampler = createTracesSampler({ defaultSampleRate });
    await applyRemoteTracesSampleRate(0.001);

    expect(sampler({ name: 'Boosted Transaction' })).toBe(0.001);
  });

  it('caps a positive parent decision at the remote ceiling', async () => {
    const sampler = createTracesSampler({ defaultSampleRate });
    await applyRemoteTracesSampleRate(0.001);

    expect(sampler({ name: 'Unlisted Transaction', parentSampled: true })).toBe(
      0.001,
    );
  });

  it('leaves a zero-pinned transaction at zero under the ceiling', async () => {
    const sampler = createTracesSampler({ defaultSampleRate });
    await applyRemoteTracesSampleRate(0.001);

    expect(sampler({ name: 'AssetsDataSourceTiming' })).toBe(0);
  });

  it('falls back to build-time behavior when no remote rate is set', () => {
    const sampler = createTracesSampler({ defaultSampleRate });

    expect(sampler({ name: 'Unlisted Transaction' })).toBe(defaultSampleRate);
    expect(sampler({ name: 'Unlisted Transaction', parentSampled: true })).toBe(
      1,
    );
  });
});

describe('createTracesSampler with the remote transactionSampleRates flag', () => {
  const defaultSampleRate = 0.0075;

  async function applyRemoteRates(sentryFlag: Record<string, unknown>) {
    globalThis.stateHooks = {
      getPersistedState: async () => ({
        data: {
          RemoteFeatureFlagController: {
            remoteFeatureFlags: { sentry: sentryFlag },
          },
        },
      }),
      getSentryState: () => ({ browser: '', version: '' }),
    };
    await applySentryRemoteRates();
  }

  afterEach(() => {
    resetSentryRemoteRates();
    // @ts-expect-error test cleanup of the global hook
    delete globalThis.stateHooks;
    delete process.env.SENTRY_SAMPLE_RATE_OVERRIDES;
  });

  it('sub-samples a named transaction at the flag rate', async () => {
    const sampler = createTracesSampler({ defaultSampleRate });
    await applyRemoteRates({
      transactionSampleRates: { 'Noisy Transaction': 0.001 },
    });

    expect(sampler({ name: 'Noisy Transaction' })).toBe(0.001);
  });

  it('passes unnamed and unlisted transactions through at the default rate', async () => {
    const sampler = createTracesSampler({ defaultSampleRate });
    await applyRemoteRates({
      transactionSampleRates: { 'Noisy Transaction': 0.001 },
    });

    expect(sampler({})).toBe(defaultSampleRate);
    expect(sampler({ name: 'Unlisted Transaction' })).toBe(defaultSampleRate);
  });

  it('wins over a build-time override for the same name', async () => {
    process.env.SENTRY_SAMPLE_RATE_OVERRIDES = JSON.stringify({
      'Contested Transaction': 0.5,
    });
    const sampler = createTracesSampler({ defaultSampleRate });
    await applyRemoteRates({
      transactionSampleRates: { 'Contested Transaction': 0.001 },
    });

    expect(sampler({ name: 'Contested Transaction' })).toBe(0.001);
  });

  it('can un-pin a built-in zero rate (remote wins in both directions)', async () => {
    const sampler = createTracesSampler({ defaultSampleRate });
    await applyRemoteRates({
      transactionSampleRates: { AssetsDataSourceTiming: 0.0001 },
    });

    expect(sampler({ name: 'AssetsDataSourceTiming' })).toBe(0.0001);
  });

  it('leaves build-time overrides in effect for names the flag omits', async () => {
    const sampler = createTracesSampler({ defaultSampleRate });
    await applyRemoteRates({
      transactionSampleRates: { 'Noisy Transaction': 0.001 },
    });

    expect(sampler({ name: 'AssetsUpdatePipeline' })).toBe(0);
  });

  it('is capped by the remote tracesSampleRate ceiling', async () => {
    const sampler = createTracesSampler({ defaultSampleRate });
    await applyRemoteRates({
      tracesSampleRate: 0.001,
      transactionSampleRates: { 'Boosted Transaction': 0.5 },
    });

    expect(sampler({ name: 'Boosted Transaction' })).toBe(0.001);
  });

  it('ignores a malformed flag value (safe no-op, build-time fallback)', async () => {
    const sampler = createTracesSampler({ defaultSampleRate });
    await applyRemoteRates({ transactionSampleRates: 'not-a-map' });

    expect(sampler({ name: 'Unlisted Transaction' })).toBe(defaultSampleRate);
    expect(sampler({ name: 'AssetsDataSourceTiming' })).toBe(0);
  });
});
