import {
  applySentryRemoteRates,
  resetSentryRemoteRates,
} from '../../../shared/lib/sentry-remote-rates';
import {
  DEFAULT_DROPPED_RELEASES,
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

  it('falls back to the deprecated transactionContext.name when top-level name is absent', () => {
    expect(
      getTransactionSampleRate(
        { transactionContext: { name: 'Dropped Transaction' } },
        { defaultSampleRate, sampleRateOverrides },
      ),
    ).toBe(0);
  });

  it('prefers the top-level name over the deprecated transactionContext.name', () => {
    expect(
      getTransactionSampleRate(
        {
          name: 'Unlisted Transaction',
          transactionContext: { name: 'Dropped Transaction' },
        },
        { defaultSampleRate, sampleRateOverrides },
      ),
    ).toBe(defaultSampleRate);
  });

  describe('whole-release drop', () => {
    const droppedReleases = new Set(['13.32.0', '13.33.0']);

    it('drops a non-throttled transaction when the build release is dropped', () => {
      expect(
        getTransactionSampleRate(
          { name: 'Unlisted Transaction' },
          {
            defaultSampleRate,
            sampleRateOverrides,
            release: '13.32.0',
            droppedReleases,
          },
        ),
      ).toBe(0);
    });

    it('drops even a parentSampled transaction when the build release is dropped', () => {
      expect(
        getTransactionSampleRate(
          { name: 'Unlisted Transaction', parentSampled: true },
          {
            defaultSampleRate,
            sampleRateOverrides,
            release: '13.33.0',
            droppedReleases,
          },
        ),
      ).toBe(0);
    });

    it('drops a transaction with no name when the build release is dropped', () => {
      expect(
        getTransactionSampleRate(
          {},
          {
            defaultSampleRate,
            sampleRateOverrides,
            release: '13.32.0',
            droppedReleases,
          },
        ),
      ).toBe(0);
    });

    it('keeps existing behavior when the build release is not dropped', () => {
      // Non-throttled root falls back to the default rate...
      expect(
        getTransactionSampleRate(
          { name: 'Unlisted Transaction' },
          {
            defaultSampleRate,
            sampleRateOverrides,
            release: '99.99.99',
            droppedReleases,
          },
        ),
      ).toBe(defaultSampleRate);
      // ...and a throttled name is still pinned to its override.
      expect(
        getTransactionSampleRate(
          { name: 'Dropped Transaction' },
          {
            defaultSampleRate,
            sampleRateOverrides,
            release: '99.99.99',
            droppedReleases,
          },
        ),
      ).toBe(0);
    });

    it('keeps existing behavior when no release is supplied', () => {
      expect(
        getTransactionSampleRate(
          { name: 'Unlisted Transaction' },
          { defaultSampleRate, sampleRateOverrides, droppedReleases },
        ),
      ).toBe(defaultSampleRate);
    });
  });
});

describe('createTracesSampler', () => {
  const defaultSampleRate = 0.0075;
  const originalEnv = process.env.SENTRY_SAMPLE_RATE_OVERRIDES;
  const originalDropEnv = process.env.SENTRY_DROP_RELEASES;
  // A release deliberately not in DEFAULT_DROPPED_RELEASES, used for the
  // "not dropped" cases.
  const undroppedRelease = '99.99.99';

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.SENTRY_SAMPLE_RATE_OVERRIDES;
    } else {
      process.env.SENTRY_SAMPLE_RATE_OVERRIDES = originalEnv;
    }
    if (originalDropEnv === undefined) {
      delete process.env.SENTRY_DROP_RELEASES;
    } else {
      process.env.SENTRY_DROP_RELEASES = originalDropEnv;
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

  describe('release-drop', () => {
    it('drops every transaction when the build release is a built-in dropped release', () => {
      delete process.env.SENTRY_DROP_RELEASES;
      // Driven off the list itself so the test tracks the configured policy.
      for (const release of DEFAULT_DROPPED_RELEASES) {
        const sampler = createTracesSampler({ defaultSampleRate, release });

        // Even a non-throttled transaction with a positive parent decision is
        // dropped wholesale.
        expect(
          sampler({ name: 'Unlisted Transaction', parentSampled: true }),
        ).toBe(0);
      }
    });

    it('leaves sampling untouched when the build release is not dropped', () => {
      delete process.env.SENTRY_DROP_RELEASES;
      const sampler = createTracesSampler({
        defaultSampleRate,
        release: undroppedRelease,
      });

      expect(sampler({ name: 'Unlisted Transaction' })).toBe(defaultSampleRate);
      for (const [name, rate] of Object.entries(
        DEFAULT_TRANSACTION_SAMPLE_RATES,
      )) {
        expect(sampler({ name })).toBe(rate);
      }
    });

    it('leaves sampling untouched when no build release is supplied', () => {
      delete process.env.SENTRY_DROP_RELEASES;
      const sampler = createTracesSampler({ defaultSampleRate });

      expect(sampler({ name: 'Unlisted Transaction' })).toBe(defaultSampleRate);
    });

    it('drops a release supplied purely via the SENTRY_DROP_RELEASES env var', () => {
      process.env.SENTRY_DROP_RELEASES = undroppedRelease;
      const sampler = createTracesSampler({
        defaultSampleRate,
        release: undroppedRelease,
      });

      expect(sampler({ name: 'Unlisted Transaction' })).toBe(0);
    });

    it('merges env-supplied dropped releases on top of the built-in defaults', () => {
      process.env.SENTRY_DROP_RELEASES = `${undroppedRelease}, 88.88.88 `;

      // Env-supplied release is dropped (and surrounding whitespace tolerated)...
      expect(
        createTracesSampler({
          defaultSampleRate,
          release: undroppedRelease,
        })({ name: 'Unlisted Transaction' }),
      ).toBe(0);
      expect(
        createTracesSampler({ defaultSampleRate, release: '88.88.88' })({
          name: 'Unlisted Transaction',
        }),
      ).toBe(0);
      // ...without dropping the built-in defaults (merge, not replace).
      for (const release of DEFAULT_DROPPED_RELEASES) {
        expect(
          createTracesSampler({ defaultSampleRate, release })({
            name: 'Unlisted Transaction',
          }),
        ).toBe(0);
      }
    });

    it('ignores a blank SENTRY_DROP_RELEASES env var (keeps built-in defaults)', () => {
      process.env.SENTRY_DROP_RELEASES = '  , ,';
      const sampler = createTracesSampler({
        defaultSampleRate,
        release: undroppedRelease,
      });

      // Blank entries add nothing, so the undropped release samples normally...
      expect(sampler({ name: 'Unlisted Transaction' })).toBe(defaultSampleRate);
      // ...and the built-in defaults are still dropped.
      for (const release of DEFAULT_DROPPED_RELEASES) {
        expect(
          createTracesSampler({ defaultSampleRate, release })({
            name: 'Unlisted Transaction',
          }),
        ).toBe(0);
      }
    });
  });
});

describe('sample-rate ceiling (release-level throttle)', () => {
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

  it('keeps a dropped release at zero regardless of the ceiling', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Boosted Transaction', parentSampled: true },
        {
          ...ceilingOptions,
          release: '13.32.0',
          droppedReleases: new Set(['13.32.0']),
        },
      ),
    ).toBe(0);
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
