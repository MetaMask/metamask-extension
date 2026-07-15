import type { BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { getBridgeHistoryTokens } from './utils';

const buildHistoryItem = (
  overrides: Partial<BridgeHistoryItem> = {},
): BridgeHistoryItem =>
  ({
    quote: {
      srcTokenAmount: '1000',
      srcAsset: {
        assetId: 'eip155:1/slip44:60',
        decimals: 18,
        symbol: 'ETH',
      },
      destTokenAmount: '2000',
      destAsset: {
        assetId: 'eip155:137/erc20:0xdai',
        decimals: 18,
        symbol: 'DAI',
      },
    },
    status: { destChain: { amount: '2100' } },
    ...overrides,
  }) as unknown as BridgeHistoryItem;

describe('getBridgeHistoryTokens', () => {
  it('returns undefined when no bridge history item is provided', () => {
    expect(getBridgeHistoryTokens()).toBeUndefined();
    expect(getBridgeHistoryTokens(undefined)).toBeUndefined();
  });

  it('maps the source token from the quote', () => {
    const result = getBridgeHistoryTokens(buildHistoryItem());

    expect(result?.sourceToken).toStrictEqual({
      amount: '1000',
      assetId: 'eip155:1/slip44:60',
      decimals: 18,
      direction: 'out',
      symbol: 'ETH',
    });
  });

  it('maps the destination token, preferring the destination chain amount', () => {
    const result = getBridgeHistoryTokens(buildHistoryItem());

    expect(result?.destinationToken).toStrictEqual({
      amount: '2100',
      assetId: 'eip155:137/erc20:0xdai',
      decimals: 18,
      direction: 'in',
      symbol: 'DAI',
    });
  });

  it('falls back to the quote destination amount when the destination chain amount is missing', () => {
    const result = getBridgeHistoryTokens(
      buildHistoryItem({ status: {} } as Partial<BridgeHistoryItem>),
    );

    expect(result?.destinationToken.amount).toBe('2000');
  });
});
