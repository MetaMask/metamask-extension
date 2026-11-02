import {
  getUniqueTokenListItemKeys,
  type TokenListDisplayItem,
} from './useTokenListData';

const createTokenItem = (symbol: string, address: string) =>
  ({
    type: 'token',
    token: { chainId: '0x1', symbol, address },
  }) as unknown as TokenListDisplayItem;

describe('getUniqueTokenListItemKeys', () => {
  it('keeps the existing key for assets that appear once', () => {
    const keys = getUniqueTokenListItemKeys([
      createTokenItem('ETH', '0x0000000000000000000000000000000000000000'),
      { type: 'low-value-toggle', count: 2 },
    ]);

    expect(keys).toStrictEqual([
      '0x1-ETH-0x0000000000000000000000000000000000000000',
      'low-value-assets-toggle-1',
    ]);
  });

  it('returns a distinct key for each repeat of the same asset', () => {
    const link = createTokenItem(
      'LINK',
      '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    );

    const keys = getUniqueTokenListItemKeys([
      link,
      createTokenItem('ETH', '0x0000000000000000000000000000000000000000'),
      link,
      link,
    ]);

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys[0]).toBe('0x1-LINK-0x514910771AF9Ca656af840dff83E8264EcF986CA');
  });
});
