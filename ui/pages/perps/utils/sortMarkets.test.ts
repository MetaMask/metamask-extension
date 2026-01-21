import type { PerpsMarketData } from '../../../components/app/perps/types';
import { sortMarkets } from './sortMarkets';

const createMockMarket = (
  overrides: Partial<PerpsMarketData> = {},
): PerpsMarketData => ({
  symbol: 'BTC',
  name: 'Bitcoin',
  price: '$50,000',
  change24hPercent: '+2.5%',
  volume: '$1.2B',
  openInterest: '$500M',
  fundingRate: 0.01,
  ...overrides,
});

describe('sortMarkets', () => {
  describe('sort by volume', () => {
    it('sorts markets by volume in descending order by default', () => {
      const markets = [
        createMockMarket({ symbol: 'A', volume: '$500M' }),
        createMockMarket({ symbol: 'B', volume: '$1.2B' }),
        createMockMarket({ symbol: 'C', volume: '$100K' }),
      ];

      const result = sortMarkets({ markets, sortBy: 'volume' });

      expect(result[0].symbol).toBe('B'); // $1.2B
      expect(result[1].symbol).toBe('A'); // $500M
      expect(result[2].symbol).toBe('C'); // $100K
    });

    it('sorts markets by volume in ascending order', () => {
      const markets = [
        createMockMarket({ symbol: 'A', volume: '$500M' }),
        createMockMarket({ symbol: 'B', volume: '$1.2B' }),
        createMockMarket({ symbol: 'C', volume: '$100K' }),
      ];

      const result = sortMarkets({ markets, sortBy: 'volume', direction: 'asc' });

      expect(result[0].symbol).toBe('C'); // $100K
      expect(result[1].symbol).toBe('A'); // $500M
      expect(result[2].symbol).toBe('B'); // $1.2B
    });

    it('handles various volume formats', () => {
      const markets = [
        createMockMarket({ symbol: 'A', volume: '$1.5T' }),
        createMockMarket({ symbol: 'B', volume: '$850M' }),
        createMockMarket({ symbol: 'C', volume: '$2.3B' }),
      ];

      const result = sortMarkets({ markets, sortBy: 'volume' });

      expect(result[0].symbol).toBe('A'); // $1.5T
      expect(result[1].symbol).toBe('C'); // $2.3B
      expect(result[2].symbol).toBe('B'); // $850M
    });
  });

  describe('sort by priceChange', () => {
    it('sorts markets by price change in descending order', () => {
      const markets = [
        createMockMarket({ symbol: 'A', change24hPercent: '+2.5%' }),
        createMockMarket({ symbol: 'B', change24hPercent: '-1.8%' }),
        createMockMarket({ symbol: 'C', change24hPercent: '+5.2%' }),
      ];

      const result = sortMarkets({ markets, sortBy: 'priceChange', direction: 'desc' });

      expect(result[0].symbol).toBe('C'); // +5.2%
      expect(result[1].symbol).toBe('A'); // +2.5%
      expect(result[2].symbol).toBe('B'); // -1.8%
    });

    it('sorts markets by price change in ascending order', () => {
      const markets = [
        createMockMarket({ symbol: 'A', change24hPercent: '+2.5%' }),
        createMockMarket({ symbol: 'B', change24hPercent: '-1.8%' }),
        createMockMarket({ symbol: 'C', change24hPercent: '+5.2%' }),
      ];

      const result = sortMarkets({ markets, sortBy: 'priceChange', direction: 'asc' });

      expect(result[0].symbol).toBe('B'); // -1.8%
      expect(result[1].symbol).toBe('A'); // +2.5%
      expect(result[2].symbol).toBe('C'); // +5.2%
    });

    it('handles placeholder values like -- and N/A without NaN issues', () => {
      const markets = [
        createMockMarket({ symbol: 'A', change24hPercent: '+2.5%' }),
        createMockMarket({ symbol: 'B', change24hPercent: '--' }),
        createMockMarket({ symbol: 'C', change24hPercent: 'N/A' }),
        createMockMarket({ symbol: 'D', change24hPercent: '-1.0%' }),
      ];

      const result = sortMarkets({ markets, sortBy: 'priceChange', direction: 'desc' });

      // Valid percentages should sort correctly, placeholders treated as 0
      expect(result[0].symbol).toBe('A'); // +2.5%
      // B, C (placeholders = 0) and D (-1.0%) - order among equals may vary
      expect(result.map((m) => m.symbol)).toContain('B');
      expect(result.map((m) => m.symbol)).toContain('C');
      expect(result.map((m) => m.symbol)).toContain('D');
    });
  });

  describe('sort by openInterest', () => {
    it('sorts markets by open interest in descending order', () => {
      const markets = [
        createMockMarket({ symbol: 'A', openInterest: '$200M' }),
        createMockMarket({ symbol: 'B', openInterest: '$1.5B' }),
        createMockMarket({ symbol: 'C', openInterest: '$50M' }),
      ];

      const result = sortMarkets({ markets, sortBy: 'openInterest' });

      expect(result[0].symbol).toBe('B'); // $1.5B
      expect(result[1].symbol).toBe('A'); // $200M
      expect(result[2].symbol).toBe('C'); // $50M
    });

    it('handles missing openInterest values', () => {
      const markets = [
        createMockMarket({ symbol: 'A', openInterest: '$200M' }),
        createMockMarket({ symbol: 'B', openInterest: undefined }),
        createMockMarket({ symbol: 'C', openInterest: '$50M' }),
      ];

      const result = sortMarkets({ markets, sortBy: 'openInterest' });

      expect(result[0].symbol).toBe('A'); // $200M
      expect(result[1].symbol).toBe('C'); // $50M
      expect(result[2].symbol).toBe('B'); // undefined
    });
  });

  describe('sort by fundingRate', () => {
    it('sorts markets by funding rate in descending order', () => {
      const markets = [
        createMockMarket({ symbol: 'A', fundingRate: 0.01 }),
        createMockMarket({ symbol: 'B', fundingRate: 0.05 }),
        createMockMarket({ symbol: 'C', fundingRate: -0.02 }),
      ];

      const result = sortMarkets({ markets, sortBy: 'fundingRate' });

      expect(result[0].symbol).toBe('B'); // 0.05
      expect(result[1].symbol).toBe('A'); // 0.01
      expect(result[2].symbol).toBe('C'); // -0.02
    });

    it('handles missing fundingRate values', () => {
      const markets = [
        createMockMarket({ symbol: 'A', fundingRate: 0.01 }),
        createMockMarket({ symbol: 'B', fundingRate: undefined }),
        createMockMarket({ symbol: 'C', fundingRate: 0.03 }),
      ];

      const result = sortMarkets({ markets, sortBy: 'fundingRate' });

      expect(result[0].symbol).toBe('C'); // 0.03
      expect(result[1].symbol).toBe('A'); // 0.01
      expect(result[2].symbol).toBe('B'); // undefined (0)
    });
  });

  describe('edge cases', () => {
    it('returns empty array for empty input', () => {
      const result = sortMarkets({ markets: [], sortBy: 'volume' });
      expect(result).toEqual([]);
    });

    it('does not mutate original array', () => {
      const markets = [
        createMockMarket({ symbol: 'A', volume: '$500M' }),
        createMockMarket({ symbol: 'B', volume: '$1.2B' }),
      ];
      const originalOrder = markets.map((m) => m.symbol);

      sortMarkets({ markets, sortBy: 'volume' });

      expect(markets.map((m) => m.symbol)).toEqual(originalOrder);
    });

    it('handles single item array', () => {
      const markets = [createMockMarket({ symbol: 'A' })];
      const result = sortMarkets({ markets, sortBy: 'volume' });
      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('A');
    });
  });
});
