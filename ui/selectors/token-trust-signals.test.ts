import { getTokenScanResultsForCacheKeys } from './token-trust-signals';

describe('token trust signal selectors', () => {
  it('returns only entries matching the requested cache keys', () => {
    const state = {
      metamask: {
        tokenScanCache: {
          'solana:mainnet:badmint111': {
            data: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              result_type: 'Malicious',
            },
          },
          'solana:mainnet:goodmint222': {
            data: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              result_type: 'Benign',
            },
          },
        },
      },
    } as never;

    expect(
      getTokenScanResultsForCacheKeys(state, [
        'solana:mainnet:badmint111',
        'solana:mainnet:missing333',
      ]),
    ).toEqual({
      'solana:mainnet:badmint111': {
        data: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: 'Malicious',
        },
      },
    });
  });

  it('returns an empty object when no cache keys are requested', () => {
    const state = {
      metamask: {
        tokenScanCache: {
          'solana:mainnet:badmint111': {
            data: {
              // eslint-disable-next-line @typescript-eslint/naming-convention
              result_type: 'Malicious',
            },
          },
        },
      },
    } as never;

    expect(getTokenScanResultsForCacheKeys(state, [])).toEqual({});
    expect(getTokenScanResultsForCacheKeys(state, undefined)).toEqual({});
  });
});
