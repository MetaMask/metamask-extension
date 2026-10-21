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
    it('passes useTerminalApi: true when terminal backend is enabled', async () => {
      mockSubmitRequestToBackground.mockResolvedValue([]);

      await fetchMarketInfos('provider:mainnet:0xabc', true);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsGetMarkets',
        [{ useTerminalApi: true }],
      );
    });

    it('passes useTerminalApi: false when terminal backend is disabled', async () => {
      mockSubmitRequestToBackground.mockResolvedValue([]);

      await fetchMarketInfos('provider:mainnet:0xabc', false);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsGetMarkets',
        [{ useTerminalApi: false }],
      );
    });

    it('defaults useTerminalApi to false when not specified', async () => {
      mockSubmitRequestToBackground.mockResolvedValue([]);

      await fetchMarketInfos('provider:mainnet:0xabc');

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsGetMarkets',
        [{ useTerminalApi: false }],
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

    it('refetches when useTerminalApi flag changes', async () => {
      const directMarkets = [{ symbol: 'BTC' }];
      const terminalMarkets = [{ symbol: 'BTC' }, { symbol: 'ETH' }];

      mockSubmitRequestToBackground.mockResolvedValue(directMarkets);
      const first = await fetchMarketInfos('provider:mainnet:0xabc', false);
      expect(first).toEqual(directMarkets);

      mockSubmitRequestToBackground.mockResolvedValue(terminalMarkets);
      const second = await fetchMarketInfos('provider:mainnet:0xabc', true);
      expect(second).toEqual(terminalMarkets);

      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(2);
    });
  });
});
