import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import {
  DEFAULT_TRANSACTION_SAMPLE_RATES,
  createTracesSampler,
  getTransactionSampleRate,
} from './sentry-traces-sampler';

jest.mock('../../../shared/lib/manifestFlags', () => ({
  getManifestFlags: jest.fn(() => ({})),
}));

const getManifestFlagsMock = jest.mocked(getManifestFlags);

describe('getTransactionSampleRate', () => {
  const defaultSampleRate = 0.0075;
  const sampleRatesByName = {
    'Dropped Transaction': 0,
    'Sub-Sampled Transaction': 0.01,
  };

  it('pins a throttled transaction to its configured rate', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Dropped Transaction' },
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(0);
  });

  it('returns a non-zero override rate verbatim', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Sub-Sampled Transaction' },
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(0.01);
  });

  it('applies the override regardless of the parent sampling decision', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Dropped Transaction', parentSampled: true },
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(0);
    expect(
      getTransactionSampleRate(
        { name: 'Dropped Transaction', parentSampled: false },
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(0);
  });

  it('inherits a positive parent decision for non-throttled transactions', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Unlisted Transaction', parentSampled: true },
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(1);
  });

  it('inherits a negative parent decision for non-throttled transactions', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Unlisted Transaction', parentSampled: false },
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(0);
  });

  it('falls back to the default rate for a root, non-throttled transaction', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Unlisted Transaction' },
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(defaultSampleRate);
  });

  it('falls back to the default rate when no name is present', () => {
    expect(
      getTransactionSampleRate({}, { defaultSampleRate, sampleRatesByName }),
    ).toBe(defaultSampleRate);
  });

  it('is a safe no-op with an empty override map', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Dropped Transaction' },
        { defaultSampleRate, sampleRatesByName: {} },
      ),
    ).toBe(defaultSampleRate);
  });

  it('falls back to the deprecated transactionContext.name when top-level name is absent', () => {
    expect(
      getTransactionSampleRate(
        { transactionContext: { name: 'Dropped Transaction' } },
        { defaultSampleRate, sampleRatesByName },
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
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(defaultSampleRate);
  });
});

describe('createTracesSampler', () => {
  const defaultSampleRate = 0.0075;

  beforeEach(() => {
    getManifestFlagsMock.mockReturnValue({});
  });

  it('uses the default rate for a transaction with no override', () => {
    const sampler = createTracesSampler({ defaultSampleRate });

    expect(sampler({ name: 'Unlisted Transaction' })).toBe(defaultSampleRate);
  });

  it('applies the built-in default overrides', () => {
    const sampler = createTracesSampler({ defaultSampleRate });

    // Driven off the map itself so the test tracks the configured policy rather
    // than any specific transaction name that happens to be throttled today.
    for (const [name, rate] of Object.entries(
      DEFAULT_TRANSACTION_SAMPLE_RATES,
    )) {
      expect(sampler({ name })).toBe(rate);
    }
  });

  it('throttles a transaction supplied purely via the manifest flag', () => {
    getManifestFlagsMock.mockReturnValue({
      sentry: { sampleRatesByName: { 'Flagged Transaction': 0 } },
    });

    const sampler = createTracesSampler({ defaultSampleRate });

    expect(sampler({ name: 'Flagged Transaction' })).toBe(0);
  });

  it('merges manifest-flag overrides on top of the built-in defaults', () => {
    getManifestFlagsMock.mockReturnValue({
      sentry: { sampleRatesByName: { 'Flagged Transaction': 0.001 } },
    });

    const sampler = createTracesSampler({ defaultSampleRate });

    // Flag-supplied override is applied...
    expect(sampler({ name: 'Flagged Transaction' })).toBe(0.001);
    // ...without dropping the built-in defaults (merge, not replace).
    for (const [name, rate] of Object.entries(
      DEFAULT_TRANSACTION_SAMPLE_RATES,
    )) {
      expect(sampler({ name })).toBe(rate);
    }
  });

  it('lets a manifest-flag override win over a built-in default rate', () => {
    const seededNames = Object.keys(DEFAULT_TRANSACTION_SAMPLE_RATES);
    // Precedence is only observable while there are seeded defaults to override.
    if (seededNames.length === 0) {
      return;
    }
    const [name] = seededNames;
    getManifestFlagsMock.mockReturnValue({
      sentry: { sampleRatesByName: { [name]: 0.5 } },
    });

    const sampler = createTracesSampler({ defaultSampleRate });

    expect(sampler({ name })).toBe(0.5);
  });
});
