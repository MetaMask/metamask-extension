import {
  fetchMarketInfos,
  clearPerpsMarketInfoModuleCache,
  fetchFillsForCacheKey,
  clearPerpsMarketFillsModuleCache,
} from './perps-cache';

const mockSubmitRequestToBackground = jest.fn();

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

jest.mock('../../components/app/perps/constants', () => ({
  PERPS_CONSTANTS: {
    FILLS_LOOKBACK_MS: 7 * 24 * 60 * 60 * 1000,
  },
}));

describe('perps-cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearPerpsMarketInfoModuleCache();
    clearPerpsMarketFillsModuleCache();
  });

  describe('fetchMarketInfos', () => {
    it('returns fetched data on success', async () => {
      const mockMarkets = [{ symbol: 'BTC' }, { symbol: 'ETH' }];
      mockSubmitRequestToBackground.mockResolvedValue(mockMarkets);

      const result = await fetchMarketInfos('test-key');

      expect(result).toEqual(mockMarkets);
    });

    it('returns empty array on first failure (no prior cache)', async () => {
      mockSubmitRequestToBackground.mockRejectedValue(new Error('network'));

      const result = await fetchMarketInfos('test-key');

      expect(result).toEqual([]);
    });

    it('returns stale cached data when fetch fails after a prior success', async () => {
      const mockMarkets = [{ symbol: 'BTC' }];
      mockSubmitRequestToBackground.mockResolvedValue(mockMarkets);

      await fetchMarketInfos('test-key');

      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 10 * 60_000);
      mockSubmitRequestToBackground.mockRejectedValue(new Error('network'));

      const result = await fetchMarketInfos('test-key');

      expect(result).toEqual(mockMarkets);

      jest.restoreAllMocks();
    });
  });

  describe('fetchFillsForCacheKey', () => {
    it('returns fetched data on success', async () => {
      const mockFills = [{ orderId: 'o1', symbol: 'BTC' }];
      mockSubmitRequestToBackground.mockResolvedValue(mockFills);

      const result = await fetchFillsForCacheKey('test-key');

      expect(result).toEqual(mockFills);
    });

    it('returns empty array on first failure (no prior cache)', async () => {
      mockSubmitRequestToBackground.mockRejectedValue(new Error('network'));

      const result = await fetchFillsForCacheKey('test-key');

      expect(result).toEqual([]);
    });

    it('returns stale cached data when fetch fails after a prior success', async () => {
      const mockFills = [{ orderId: 'o1', symbol: 'BTC' }];
      mockSubmitRequestToBackground.mockResolvedValue(mockFills);

      await fetchFillsForCacheKey('test-key');

      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 60_000);
      mockSubmitRequestToBackground.mockRejectedValue(new Error('network'));

      const result = await fetchFillsForCacheKey('test-key');

      expect(result).toEqual(mockFills);

      jest.restoreAllMocks();
    });
  });
});
