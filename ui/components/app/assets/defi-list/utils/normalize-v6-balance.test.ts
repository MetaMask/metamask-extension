import type { V6BalanceItem } from '@metamask/core-backend';
import {
  getDefiPositionMarketValue,
  getNormalizedV6Balance,
} from './normalize-v6-balance';

const createBalance = (
  overrides: Partial<V6BalanceItem> = {},
): V6BalanceItem => ({
  category: 'defi',
  assetId: 'eip155:1/slip44:60',
  name: 'Ethereum',
  symbol: 'ETH',
  decimals: 18,
  balance: '1.0990255450977409',
  price: '1767.15',
  ...overrides,
});

describe('normalize-v6-balance', () => {
  describe('getNormalizedV6Balance', () => {
    it('returns the human-readable balance from the v6 API', () => {
      expect(getNormalizedV6Balance(createBalance())).toBeCloseTo(
        1.0990255450977409,
      );
    });

    it('returns 0 for invalid balances', () => {
      expect(
        getNormalizedV6Balance(createBalance({ balance: 'not-a-number' })),
      ).toBe(0);
    });
  });

  describe('getDefiPositionMarketValue', () => {
    it('calculates fiat value from human-readable balances and prices', () => {
      const marketValue = getDefiPositionMarketValue(createBalance());

      expect(marketValue).toBeCloseTo(1942.1, 0);
    });

    it('returns 0 when price is missing', () => {
      expect(
        getDefiPositionMarketValue(createBalance({ price: undefined })),
      ).toBe(0);
    });
  });
});
