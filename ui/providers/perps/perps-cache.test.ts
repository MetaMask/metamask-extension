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
    mockSubmitRequestToBackground.mockResolvedValue([]);
  });

  describe('fetchMarketInfos', () => {
    it('passes useTerminalApi: true to perpsGetMarkets', async () => {
      await fetchMarketInfos('provider:mainnet:0xabc');

      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsGetMarkets',
        [{ useTerminalApi: true }],
      );
    });
  });
});
