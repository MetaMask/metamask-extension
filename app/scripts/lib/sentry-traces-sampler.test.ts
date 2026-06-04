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
  const sampleRatesByName = { AssetsDataSourceTiming: 0, NoisyButKept: 0.01 };

  it('pins a throttled transaction to its configured rate', () => {
    expect(
      getTransactionSampleRate(
        { name: 'AssetsDataSourceTiming' },
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(0);
  });

  it('returns a non-zero override rate verbatim', () => {
    expect(
      getTransactionSampleRate(
        { name: 'NoisyButKept' },
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(0.01);
  });

  it('applies the override regardless of the parent sampling decision', () => {
    expect(
      getTransactionSampleRate(
        { name: 'AssetsDataSourceTiming', parentSampled: true },
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(0);
    expect(
      getTransactionSampleRate(
        { name: 'AssetsDataSourceTiming', parentSampled: false },
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(0);
  });

  it('inherits a positive parent decision for non-throttled transactions', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Some Other Transaction', parentSampled: true },
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(1);
  });

  it('inherits a negative parent decision for non-throttled transactions', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Some Other Transaction', parentSampled: false },
        { defaultSampleRate, sampleRatesByName },
      ),
    ).toBe(0);
  });

  it('falls back to the default rate for a root, non-throttled transaction', () => {
    expect(
      getTransactionSampleRate(
        { name: 'Some Other Transaction' },
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
        { name: 'AssetsDataSourceTiming' },
        { defaultSampleRate, sampleRatesByName: {} },
      ),
    ).toBe(defaultSampleRate);
  });
});

describe('createTracesSampler', () => {
  beforeEach(() => {
    getManifestFlagsMock.mockReturnValue({});
  });

  it('drops the seeded assets-controller transactions by default', () => {
    const sampler = createTracesSampler({ defaultSampleRate: 0.0075 });

    expect(sampler({ name: 'AssetsDataSourceTiming' })).toBe(0);
    expect(sampler({ name: 'AssetsUpdatePipeline' })).toBe(0);
  });

  it('uses the default rate for transactions with no override', () => {
    const sampler = createTracesSampler({ defaultSampleRate: 0.0075 });

    expect(sampler({ name: 'Transaction' })).toBe(0.0075);
  });

  it('merges and lets the manifest flag override the built-in rates', () => {
    getManifestFlagsMock.mockReturnValue({
      sentry: {
        sampleRatesByName: { AssetsDataSourceTiming: 0.001, Transaction: 0 },
      },
    });

    const sampler = createTracesSampler({ defaultSampleRate: 0.0075 });

    // Manifest flag re-budgets the seeded default.
    expect(sampler({ name: 'AssetsDataSourceTiming' })).toBe(0.001);
    // Built-in default for the other assets span still applies.
    expect(sampler({ name: 'AssetsUpdatePipeline' })).toBe(0);
    // A brand-new name can be throttled purely via the flag.
    expect(sampler({ name: 'Transaction' })).toBe(0);
  });

  it('exposes the seeded defaults', () => {
    expect(DEFAULT_TRANSACTION_SAMPLE_RATES).toMatchObject({
      AssetsDataSourceTiming: 0,
      AssetsUpdatePipeline: 0,
    });
  });
});
