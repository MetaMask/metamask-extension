import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { getBridgeHistoryTokens } from './getBridgeHistoryTokens';

const buildHistoryItem = (
  overrides: {
    destChainAmount?: string;
    destChain?: unknown;
  } = {},
): BridgeHistoryItem =>
  ({
    quote: {
      srcTokenAmount: '1000000000000000000',
      srcAsset: {
        assetId: 'eip155:1/slip44:60',
        decimals: 18,
        symbol: 'ETH',
      },
      destTokenAmount: '2000000000000000000',
      destAsset: {
        assetId: 'eip155:137/erc20:0xdai',
        decimals: 18,
        symbol: 'DAI',
      },
    },
    status: {
      destChain:
        'destChain' in overrides
          ? overrides.destChain
          : { amount: overrides.destChainAmount, txHash: '0xdesthash' },
    },
  }) as unknown as BridgeHistoryItem;

describe('getBridgeHistoryTokens', () => {
  it('returns undefined when no bridge history item is provided', () => {
    expect(getBridgeHistoryTokens(undefined)).toBeUndefined();
  });

  it('maps the source token from the quote source asset', () => {
    const result = getBridgeHistoryTokens(
      buildHistoryItem({ destChainAmount: '2000000000000000000' }),
    );

    expect(result?.sourceToken).toStrictEqual({
      amount: '1000000000000000000',
      assetId: 'eip155:1/slip44:60',
      decimals: 18,
      direction: 'out',
      symbol: 'ETH',
    });
  });

  it('maps the destination token using the settled destination-chain amount', () => {
    const result = getBridgeHistoryTokens(
      buildHistoryItem({ destChainAmount: '1950000000000000000' }),
    );

    expect(result?.destinationToken).toStrictEqual({
      amount: '1950000000000000000',
      assetId: 'eip155:137/erc20:0xdai',
      decimals: 18,
      direction: 'in',
      symbol: 'DAI',
    });
  });

  it('falls back to the quoted destination amount when the destination-chain amount is missing', () => {
    const result = getBridgeHistoryTokens(
      buildHistoryItem({ destChainAmount: undefined }),
    );

    expect(result?.destinationToken.amount).toBe('2000000000000000000');
  });

  it('falls back to the quoted destination amount when there is no destination chain yet', () => {
    const result = getBridgeHistoryTokens(
      buildHistoryItem({ destChain: undefined }),
    );

    expect(result?.destinationToken.amount).toBe('2000000000000000000');
  });
});
