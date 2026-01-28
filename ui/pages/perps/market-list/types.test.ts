import type { PerpsMarketData } from '../../../components/app/perps/types';
import { filterMarketsByType, type MarketFilter } from './types';

const createMockMarket = (
  overrides: Partial<PerpsMarketData> = {},
): PerpsMarketData => ({
  symbol: overrides.symbol ?? 'BTC',
  name: overrides.name ?? 'Bitcoin',
  maxLeverage: overrides.maxLeverage ?? '50x',
  price: overrides.price ?? '$50,000',
  change24h: overrides.change24h ?? '+$1,250.00',
  change24hPercent: overrides.change24hPercent ?? '+2.5%',
  volume: overrides.volume ?? '$1.2B',
  openInterest: 'openInterest' in overrides ? overrides.openInterest : '$500M',
  nextFundingTime: overrides.nextFundingTime,
  fundingIntervalHours: overrides.fundingIntervalHours,
  fundingRate: 'fundingRate' in overrides ? overrides.fundingRate : 0.01,
  marketSource: overrides.marketSource,
  marketType: overrides.marketType,
});

describe('filterMarketsByType', () => {
  const mockMarkets: PerpsMarketData[] = [
    createMockMarket({ symbol: 'BTC', marketType: undefined }),
    createMockMarket({ symbol: 'ETH', marketType: 'crypto' }),
    createMockMarket({ symbol: 'xyz:AAPL', marketType: 'equity' }),
    createMockMarket({ symbol: 'xyz:TSLA', marketType: 'equity' }),
    createMockMarket({ symbol: 'xyz:GOLD', marketType: 'commodity' }),
    createMockMarket({ symbol: 'xyz:SILVER', marketType: 'commodity' }),
    createMockMarket({ symbol: 'xyz:EUR', marketType: 'forex' }),
    createMockMarket({ symbol: 'xyz:GBP', marketType: 'forex' }),
  ];

  describe('null filter (show all)', () => {
    it('returns all markets when filter is null', () => {
      const result = filterMarketsByType(mockMarkets, null);

      expect(result).toHaveLength(mockMarkets.length);
      expect(result).toEqual(mockMarkets);
    });
  });

  describe('crypto filter', () => {
    it('returns only crypto markets (including undefined marketType)', () => {
      const result = filterMarketsByType(mockMarkets, 'crypto');

      expect(result).toHaveLength(2);
      expect(result.map((m) => m.symbol)).toEqual(['BTC', 'ETH']);
    });
  });

  describe('stocks filter', () => {
    it('returns only equity markets', () => {
      const result = filterMarketsByType(mockMarkets, 'stocks');

      expect(result).toHaveLength(2);
      expect(result.map((m) => m.symbol)).toEqual(['xyz:AAPL', 'xyz:TSLA']);
    });
  });

  describe('commodities filter', () => {
    it('returns only commodity markets', () => {
      const result = filterMarketsByType(mockMarkets, 'commodities');

      expect(result).toHaveLength(2);
      expect(result.map((m) => m.symbol)).toEqual(['xyz:GOLD', 'xyz:SILVER']);
    });
  });

  describe('forex filter', () => {
    it('returns only forex markets', () => {
      const result = filterMarketsByType(mockMarkets, 'forex');

      expect(result).toHaveLength(2);
      expect(result.map((m) => m.symbol)).toEqual(['xyz:EUR', 'xyz:GBP']);
    });
  });

  describe('watchlist filter', () => {
    it('returns only watchlisted markets', () => {
      const watchlist = ['BTC', 'xyz:GOLD'];
      const result = filterMarketsByType(mockMarkets, 'watchlist', watchlist);

      expect(result).toHaveLength(2);
      expect(result.map((m) => m.symbol)).toEqual(['BTC', 'xyz:GOLD']);
    });

    it('returns empty array when watchlist is empty', () => {
      const result = filterMarketsByType(mockMarkets, 'watchlist', []);

      expect(result).toHaveLength(0);
    });

    it('handles symbols not in markets list', () => {
      const watchlist = ['DOGE', 'xyz:UNKNOWN'];
      const result = filterMarketsByType(mockMarkets, 'watchlist', watchlist);

      expect(result).toHaveLength(0);
    });
  });

  describe('edge cases', () => {
    it('handles empty markets array', () => {
      const result = filterMarketsByType([], 'crypto');

      expect(result).toHaveLength(0);
    });

    it('uses default empty watchlist when not provided', () => {
      const result = filterMarketsByType(mockMarkets, 'watchlist');

      expect(result).toHaveLength(0);
    });
  });
});
