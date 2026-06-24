import {
  fetchMarketInfos,
  clearPerpsMarketInfoModuleCache,
} from './perps-cache';

const mockSubmitRequestToBackground = jest.fn();

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: (...args: unknown[]) =>
    mockSubmitRequestToBackground(...args),
}));

describe('perps-cache', () => {
  beforeEach(() => {
    clearPerpsMarketInfoModuleCache();
    mockSubmitRequestToBackground.mockReset();
  });

  describe('fetchMarketInfos', () => {
    it('passes useTerminalApi: true to perpsGetMarkets', async () => {
      mockSubmitRequestToBackground.mockResolvedValue([]);

      await fetchMarketInfos('provider:mainnet:0xabc');

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsGetMarkets',
        [{ useTerminalApi: true }],
      );
    });

    it('returns validated market array on success', async () => {
      const markets = [{ symbol: 'BTC' }, { symbol: 'ETH' }];
      mockSubmitRequestToBackground.mockResolvedValue(markets);

      const result = await fetchMarketInfos('provider:mainnet:0xabc');

      expect(result).toEqual(markets);
    });

    it('returns empty array on rejection', async () => {
      mockSubmitRequestToBackground.mockRejectedValue(
        new Error('network error'),
      );

      const result = await fetchMarketInfos('provider:mainnet:0xabc');

      expect(result).toEqual([]);
    });

    it('caches results and does not refetch within TTL', async () => {
      const markets = [{ symbol: 'BTC' }];
      mockSubmitRequestToBackground.mockResolvedValue(markets);

      const first = await fetchMarketInfos('provider:mainnet:0xabc');
      mockSubmitRequestToBackground.mockClear();

      const second = await fetchMarketInfos('provider:mainnet:0xabc');

      expect(first).toEqual(markets);
      expect(second).toEqual(markets);
      expect(mockSubmitRequestToBackground).not.toHaveBeenCalled();
    });
  });
});
