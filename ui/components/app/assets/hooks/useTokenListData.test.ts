import {
  getTokenListItemKey,
  type TokenListDisplayItem,
} from './useTokenListData';

describe('getTokenListItemKey', () => {
  const tokenItem = {
    type: 'token',
    token: {
      chainId: '0x1',
      symbol: 'ETH',
      address: '0x0000000000000000000000000000000000000000',
    },
  } as unknown as TokenListDisplayItem;

  it('includes the account group so the same token on two accounts is a different row', () => {
    const first = getTokenListItemKey(tokenItem, 0, 'entropy:wallet/0');
    const second = getTokenListItemKey(tokenItem, 0, 'entropy:wallet/1');

    expect(first).not.toBe(second);
    expect(first).toContain('entropy:wallet/0');
    expect(second).toContain('entropy:wallet/1');
  });

  it('scopes the low value toggle to the account group', () => {
    expect(
      getTokenListItemKey(
        { type: 'low-value-toggle', count: 3 },
        4,
        'entropy:wallet/0',
      ),
    ).toBe('entropy:wallet/0:low-value-assets-toggle-4');
  });
});
