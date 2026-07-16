import {
  applySentryRemoteRates,
  getRemoteTransactionSampleRates,
  getRemoteWrapperSampleRate,
  resetSentryRemoteRates,
} from './sentry-remote-rates';
import { shouldSampleWrappers } from './wrapper-sampling';

const SAMPLED_TRACE_ID = '00000000aaaaaaaaaaaaaaaaaaaaaaaa'; // bucket 0
const UNSAMPLED_TRACE_ID = 'ffffffffaaaaaaaaaaaaaaaaaaaaaaaa'; // bucket 9999

function mockPersistedState(sentryFlag: unknown) {
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
}

function mockClient() {
  const options: { tracesSampleRate?: number } = { tracesSampleRate: 0.0075 };
  return { getOptions: () => options, options };
}

describe('applySentryRemoteRates', () => {
  afterEach(() => {
    resetSentryRemoteRates();
    // @ts-expect-error test cleanup of the global hook
    delete globalThis.stateHooks;
  });

  it('applies valid remote rates to the client and wrapper cache', async () => {
    mockPersistedState({ tracesSampleRate: 0.02, wrapperSampleRate: 0.5 });
    const client = mockClient();

    const applied = await applySentryRemoteRates(client);

    expect(applied).toStrictEqual({
      tracesSampleRate: 0.02,
      wrapperSampleRate: 0.5,
      transactionSampleRates: undefined,
    });
    expect(client.options.tracesSampleRate).toBe(0.02);
    expect(getRemoteWrapperSampleRate()).toBe(0.5);
  });

  it('accepts the boundary rates 0 and 1', async () => {
    mockPersistedState({ tracesSampleRate: 0, wrapperSampleRate: 1 });
    const client = mockClient();

    await applySentryRemoteRates(client);

    expect(client.options.tracesSampleRate).toBe(0);
    expect(getRemoteWrapperSampleRate()).toBe(1);
  });

  const INVALID_RATES: [label: string, value: unknown][] = [
    ['negative', -0.1],
    ['above one', 1.5],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['string', '0.5'],
    ['null', null],
    ['object', { rate: 0.5 }],
  ];
  for (const [label, value] of INVALID_RATES) {
    it(`ignores an invalid rate (${label}) and keeps fallbacks`, async () => {
      mockPersistedState({ tracesSampleRate: value, wrapperSampleRate: value });
      const client = mockClient();

      const applied = await applySentryRemoteRates(client);

      expect(applied).toStrictEqual({
        tracesSampleRate: undefined,
        wrapperSampleRate: undefined,
        transactionSampleRates: undefined,
      });
      expect(client.options.tracesSampleRate).toBe(0.0075);
      expect(getRemoteWrapperSampleRate()).toBeUndefined();
    });
  }

  it('applies a partial flag without touching the other rate', async () => {
    mockPersistedState({ wrapperSampleRate: 0.05 });
    const client = mockClient();

    await applySentryRemoteRates(client);

    expect(client.options.tracesSampleRate).toBe(0.0075);
    expect(getRemoteWrapperSampleRate()).toBe(0.05);
  });

  it('falls back when the sentry flag is absent', async () => {
    mockPersistedState(undefined);
    const client = mockClient();

    const applied = await applySentryRemoteRates(client);

    expect(applied).toStrictEqual({
      tracesSampleRate: undefined,
      wrapperSampleRate: undefined,
      transactionSampleRates: undefined,
    });
    expect(client.options.tracesSampleRate).toBe(0.0075);
  });

  it('falls back when stateHooks is unavailable', async () => {
    const client = mockClient();

    await expect(applySentryRemoteRates(client)).resolves.toStrictEqual({
      tracesSampleRate: undefined,
      wrapperSampleRate: undefined,
      transactionSampleRates: undefined,
    });
    expect(client.options.tracesSampleRate).toBe(0.0075);
    expect(getRemoteWrapperSampleRate()).toBeUndefined();
  });

  it('falls back when reading persisted state throws', async () => {
    globalThis.stateHooks = {
      getPersistedState: async () => {
        throw new Error('storage unavailable');
      },
      getSentryState: () => ({ browser: '', version: '' }),
    };

    await expect(applySentryRemoteRates(mockClient())).resolves.toStrictEqual(
      {},
    );
    expect(getRemoteWrapperSampleRate()).toBeUndefined();
  });

  it('works without a client (wrapper rate only)', async () => {
    mockPersistedState({ tracesSampleRate: 0.02, wrapperSampleRate: 0.5 });

    const applied = await applySentryRemoteRates();

    expect(applied.tracesSampleRate).toBe(0.02);
    expect(getRemoteWrapperSampleRate()).toBe(0.5);
  });

  describe('transactionSampleRates', () => {
    it('caches a valid name -> rate map', async () => {
      mockPersistedState({
        transactionSampleRates: { 'Noisy Transaction': 0.001, 'Quiet One': 1 },
      });

      await applySentryRemoteRates();

      expect(getRemoteTransactionSampleRates()).toStrictEqual({
        'Noisy Transaction': 0.001,
        'Quiet One': 1,
      });
    });

    it('drops invalid entries and keeps valid ones', async () => {
      mockPersistedState({
        transactionSampleRates: {
          'Valid Entry': 0.5,
          'Out Of Range': 2,
          'Wrong Type': 'high',
          'Not Finite': Infinity,
        },
      });

      await applySentryRemoteRates();

      expect(getRemoteTransactionSampleRates()).toStrictEqual({
        'Valid Entry': 0.5,
      });
    });

    const INVALID_RATE_MAPS: [label: string, value: unknown][] = [
      ['array', [0.5]],
      ['string', 'AssetsDataSourceTiming=0'],
      ['number', 0.5],
      ['null', null],
      ['all-invalid map', { 'Only Entry': -1 }],
      ['empty map', {}],
    ];
    for (const [label, value] of INVALID_RATE_MAPS) {
      it(`yields undefined for a ${label} value`, async () => {
        mockPersistedState({ transactionSampleRates: value });

        await applySentryRemoteRates();

        expect(getRemoteTransactionSampleRates()).toBeUndefined();
      });
    }
  });

  describe('shouldSampleWrappers integration', () => {
    it('uses the compile-time rate when no override was applied', () => {
      expect(shouldSampleWrappers(SAMPLED_TRACE_ID)).toBe(true);
      expect(shouldSampleWrappers(UNSAMPLED_TRACE_ID)).toBe(false);
    });

    it('uses the remote override once applied', async () => {
      mockPersistedState({ wrapperSampleRate: 1 });
      await applySentryRemoteRates();

      expect(shouldSampleWrappers(UNSAMPLED_TRACE_ID)).toBe(true);

      resetSentryRemoteRates();
      expect(shouldSampleWrappers(UNSAMPLED_TRACE_ID)).toBe(false);
    });
  });
});
