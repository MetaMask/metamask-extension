import { submitRequestToBackground } from '../../store/background-connection';
import { createPerpsControllerFacade } from './createPerpsControllerFacade';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground =
  submitRequestToBackground as jest.MockedFunction<
    typeof submitRequestToBackground
  >;

describe('createPerpsControllerFacade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('facade creation', () => {
    it('creates a facade without a streaming controller (Phase 2)', () => {
      const facade = createPerpsControllerFacade(null);
      expect(facade).toBeDefined();
    });

    it('exposes empty state object', () => {
      const facade = createPerpsControllerFacade(null);
      expect(facade.state).toBeDefined();
      expect(typeof facade.state).toBe('object');
    });
  });

  describe('delegate methods', () => {
    it('init delegates to perpsInit', async () => {
      const facade = createPerpsControllerFacade(null);
      mockSubmitRequestToBackground.mockResolvedValue(undefined);
      await facade.init();
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsInit',
        [],
      );
    });

    it('disconnect delegates to perpsDisconnect', async () => {
      const facade = createPerpsControllerFacade(null);
      mockSubmitRequestToBackground.mockResolvedValue(undefined);
      await facade.disconnect();
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsDisconnect',
        [],
      );
    });

    it('placeOrder delegates to perpsPlaceOrder with args', async () => {
      const facade = createPerpsControllerFacade(null);
      mockSubmitRequestToBackground.mockResolvedValue(undefined);
      const order = {
        symbol: 'ETH',
        isBuy: true,
        size: '1',
        orderType: 'market' as const,
      };
      await facade.placeOrder(order);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsPlaceOrder',
        [order],
      );
    });

    it('updateMargin delegates to perpsUpdateMargin with args', async () => {
      const facade = createPerpsControllerFacade(null);
      mockSubmitRequestToBackground.mockResolvedValue(undefined);
      await facade.updateMargin({ symbol: 'ETH', amount: '100' });
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsUpdateMargin',
        [{ symbol: 'ETH', amount: '100' }],
      );
    });

    it('getPositions delegates to perpsGetPositions with args', async () => {
      const facade = createPerpsControllerFacade(null);
      const positions = [{ positionId: 'p1' }];
      mockSubmitRequestToBackground.mockResolvedValue(positions);
      const result = await facade.getPositions({ skipCache: true });
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsGetPositions',
        [{ skipCache: true }],
      );
      expect(result).toBe(positions);
    });

    it('getMarketDataWithPrices delegates to perpsGetMarketDataWithPrices', async () => {
      const facade = createPerpsControllerFacade(null);
      const markets = [{ market: 'ETH' }];
      mockSubmitRequestToBackground.mockResolvedValue(markets);
      const result = await facade.getMarketDataWithPrices();
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsGetMarketDataWithPrices',
        [],
      );
      expect(result).toBe(markets);
    });

    it('depositWithConfirmation delegates to perpsDepositWithConfirmation and returns transaction id', async () => {
      const facade = createPerpsControllerFacade(null);
      mockSubmitRequestToBackground.mockResolvedValue('tx-456');
      const result = await facade.depositWithConfirmation({ amount: '1.5' });
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsDepositWithConfirmation',
        [{ amount: '1.5' }],
      );
      expect(result).toBe('tx-456');
    });
  });
});
