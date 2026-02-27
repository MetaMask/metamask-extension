import { submitRequestToBackground } from '../../store/background-connection';
import { createPerpsControllerFacade } from './createPerpsControllerFacade';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

const mockSubmitRequestToBackground =
  submitRequestToBackground as jest.MockedFunction<
    typeof submitRequestToBackground
  >;

function makeStreamingController() {
  const subscribeToPositions = jest.fn().mockReturnValue(jest.fn());
  const subscribeToOrders = jest.fn().mockReturnValue(jest.fn());
  const subscribeToAccount = jest.fn().mockReturnValue(jest.fn());
  const subscribeToPrices = jest.fn().mockReturnValue(jest.fn());
  const subscribeToOrderBook = jest.fn().mockReturnValue(jest.fn());
  const subscribeToOrderFills = jest.fn().mockReturnValue(jest.fn());
  const subscribeToCandles = jest.fn().mockReturnValue(jest.fn());
  const disconnect = jest.fn();
  return {
    state: { test: true },
    messenger: {},
    subscribeToPositions,
    subscribeToOrders,
    subscribeToAccount,
    subscribeToPrices,
    subscribeToOrderBook,
    subscribeToOrderFills,
    subscribeToCandles,
    disconnect,
  };
}

describe('createPerpsControllerFacade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('streaming methods', () => {
    it('forwards subscribeToPositions to the real controller', () => {
      const real = makeStreamingController();
      const facade = createPerpsControllerFacade(real as never);
      const callback = jest.fn();
      facade.subscribeToPositions({ callback });
      expect(real.subscribeToPositions).toHaveBeenCalledWith({ callback });
    });

    it('forwards subscribeToOrders to the real controller', () => {
      const real = makeStreamingController();
      const facade = createPerpsControllerFacade(real as never);
      const callback = jest.fn();
      facade.subscribeToOrders({ callback });
      expect(real.subscribeToOrders).toHaveBeenCalledWith({ callback });
    });

    it('forwards disconnect to the real controller', () => {
      const real = makeStreamingController();
      const facade = createPerpsControllerFacade(real as never);
      facade.disconnect();
      expect(real.disconnect).toHaveBeenCalled();
    });
  });

  describe('state and messenger', () => {
    it('exposes state from the real controller', () => {
      const real = makeStreamingController();
      const facade = createPerpsControllerFacade(real as never);
      expect(facade.state).toBe(real.state);
    });

    it('exposes messenger from the real controller', () => {
      const real = makeStreamingController();
      const facade = createPerpsControllerFacade(real as never);
      expect((facade as unknown as { messenger: unknown }).messenger).toBe(
        real.messenger,
      );
    });
  });

  describe('delegate methods', () => {
    it('placeOrder delegates to perpsPlaceOrder with args', async () => {
      const real = makeStreamingController();
      const facade = createPerpsControllerFacade(real as never);
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
      const real = makeStreamingController();
      const facade = createPerpsControllerFacade(real as never);
      mockSubmitRequestToBackground.mockResolvedValue(undefined);
      await facade.updateMargin({ symbol: 'ETH', amount: '100' });
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'perpsUpdateMargin',
        [{ symbol: 'ETH', amount: '100' }],
      );
    });

    it('getPositions delegates to perpsGetPositions with args', async () => {
      const real = makeStreamingController();
      const facade = createPerpsControllerFacade(real as never);
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
      const real = makeStreamingController();
      const facade = createPerpsControllerFacade(real as never);
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
      const real = makeStreamingController();
      const facade = createPerpsControllerFacade(real as never);
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
