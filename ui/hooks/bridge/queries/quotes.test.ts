import { FeatureId } from '@metamask/bridge-controller';
import { bridgeQuotesKeys, bridgeQuotesOptions } from './quotes';

describe('bridgeQuotesKeys', () => {
  it('builds a stable detail key from quote request params', () => {
    expect(
      bridgeQuotesKeys.detail({
        walletAddress: '0xabc',
        destWalletAddress: '0xdef',
        srcChainId: '0x1',
        destChainId: '0x89',
        srcTokenAddress: '0xsrc',
        destTokenAddress: '0xdest',
        srcTokenAmount: '1000000',
        slippage: 0.5,
        insufficientBal: false,
        gasIncluded: true,
        gasIncluded7702: false,
      }),
    ).toEqual([
      'bridge',
      'quotes',
      '0x1',
      '0x89',
      '0xsrc',
      '0xdest',
      '1000000',
      '0xabc',
      '0xdef',
      0.5,
      false,
      true,
      false,
    ]);
  });

  it('changes when amount or tokens change', () => {
    const base = {
      walletAddress: '0xabc',
      srcChainId: '0x1',
      destChainId: '0x89',
      srcTokenAddress: '0xsrc',
      destTokenAddress: '0xdest',
      srcTokenAmount: '1000000',
      gasIncluded: false,
      gasIncluded7702: false,
    };

    expect(bridgeQuotesKeys.detail(base)).not.toEqual(
      bridgeQuotesKeys.detail({ ...base, srcTokenAmount: '2000000' }),
    );
    expect(bridgeQuotesKeys.detail(base)).not.toEqual(
      bridgeQuotesKeys.detail({ ...base, destTokenAddress: '0xother' }),
    );
  });
});

describe('bridgeQuotesOptions', () => {
  it('stops refetching after maxRefreshCount updates', () => {
    const options = bridgeQuotesOptions(
      {
        walletAddress: '0xabc',
        srcChainId: '0x1',
        destChainId: '0x89',
        srcTokenAddress: '0xsrc',
        destTokenAddress: '0xdest',
        srcTokenAmount: '1000',
        gasIncluded: false,
        gasIncluded7702: false,
      },
      {
        refetchIntervalMs: 30_000,
        maxRefreshCount: 2,
        featureId: FeatureId.UNIFIED_SWAP_BRIDGE,
      },
    );

    const refetchInterval = options.refetchInterval;
    expect(typeof refetchInterval).toBe('function');
    if (typeof refetchInterval !== 'function') {
      throw new Error('expected refetchInterval function');
    }

    expect(
      refetchInterval({
        state: { dataUpdateCount: 1 },
      } as never),
    ).toBe(30_000);
    expect(
      refetchInterval({
        state: { dataUpdateCount: 2 },
      } as never),
    ).toBe(false);
  });
});
