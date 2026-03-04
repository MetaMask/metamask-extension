import {
  PerpsController,
  getDefaultPerpsControllerState,
  type PerpsControllerState,
} from '@metamask/perps-controller';
import { createPerpsInfrastructure } from '../controllers/perps/infrastructure';
import { buildControllerInitRequestMock } from './test/utils';
import { PerpsControllerInit } from './perps-controller-init';
import type { PerpsControllerMessenger } from './messengers/perps-controller-messenger';
import type { ControllerInitRequest } from './types';

jest.mock('@metamask/perps-controller', () => {
  const actual = jest.requireActual('@metamask/perps-controller');
  return {
    ...actual,
    PerpsController: jest.fn().mockImplementation(() => ({
      state: { initializationState: 'uninitialized' },
      init: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn(),
      placeOrder: jest.fn(),
      closePosition: jest.fn(),
      closePositions: jest.fn(),
      editOrder: jest.fn(),
      cancelOrder: jest.fn(),
      cancelOrders: jest.fn(),
      updatePositionTPSL: jest.fn(),
      updateMargin: jest.fn(),
      flipPosition: jest.fn(),
      withdraw: jest.fn(),
      depositWithConfirmation: jest.fn(),
      getPositions: jest.fn(),
      getMarkets: jest.fn(),
      getMarketDataWithPrices: jest.fn(),
      getOrderFills: jest.fn(),
      getOrders: jest.fn(),
      getOpenOrders: jest.fn(),
      getFunding: jest.fn(),
      getAccountState: jest.fn(),
      getHistoricalPortfolio: jest.fn(),
      fetchHistoricalCandles: jest.fn(),
      calculateFees: jest.fn(),
      getAvailableDexs: jest.fn(),
      refreshEligibility: jest.fn(),
      toggleTestnet: jest.fn(),
      saveTradeConfiguration: jest.fn(),
      getTradeConfiguration: jest.fn(),
      savePendingTradeConfiguration: jest.fn(),
      getPendingTradeConfiguration: jest.fn(),
      clearPendingTradeConfiguration: jest.fn(),
      saveMarketFilterPreferences: jest.fn(),
      getMarketFilterPreferences: jest.fn(),
      setSelectedPaymentToken: jest.fn(),
      resetSelectedPaymentToken: jest.fn(),
      markTutorialCompleted: jest.fn(),
      markFirstOrderCompleted: jest.fn(),
      resetFirstTimeUserState: jest.fn(),
      clearPendingTransactionRequests: jest.fn(),
      saveOrderBookGrouping: jest.fn(),
      getOrderBookGrouping: jest.fn(),
      getActiveProvider: jest.fn().mockReturnValue({
        getUserHistory: jest.fn(),
      }),
      clearDepositResult: jest.fn(),
      clearWithdrawResult: jest.fn(),
      getBlockExplorerUrl: jest.fn(),
      getCurrentNetwork: jest.fn(),
      isFirstTimeUserOnCurrentNetwork: jest.fn(),
      getWatchlistMarkets: jest.fn(),
      toggleWatchlistMarket: jest.fn(),
      isWatchlistMarket: jest.fn(),
    })),
  };
});

jest.mock('../controllers/perps/infrastructure', () => ({
  createPerpsInfrastructure: jest.fn().mockReturnValue({}),
}));

type InitRequest = jest.Mocked<
  ControllerInitRequest<PerpsControllerMessenger, undefined>
>;

function getInitRequestMock(): InitRequest {
  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: {} as PerpsControllerMessenger,
    initMessenger: undefined as never,
  };
}

function initWithApi(request?: InitRequest) {
  const result = PerpsControllerInit(request ?? getInitRequestMock());
  const { api } = result;
  if (!api) {
    throw new Error('Expected api to be defined');
  }
  return { ...result, api };
}

describe('PerpsControllerInit', () => {
  const PerpsControllerMock = jest.mocked(PerpsController);

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MM_PERPS_BLOCKED_REGIONS;
  });

  describe('controller instantiation', () => {
    it('returns a controller instance and api', () => {
      const request = getInitRequestMock();
      const result = PerpsControllerInit(request);

      expect(result.controller).toBeDefined();
      expect(result.api).toBeDefined();
    });

    it('creates PerpsController with correct arguments', () => {
      const request = getInitRequestMock();
      PerpsControllerInit(request);

      expect(PerpsControllerMock).toHaveBeenCalledWith({
        messenger: request.controllerMessenger,
        state: expect.objectContaining(getDefaultPerpsControllerState()),
        infrastructure: expect.any(Object),
        clientConfig: {
          fallbackHip3Enabled: true,
          fallbackHip3AllowlistMarkets: [],
          fallbackBlockedRegions: [],
        },
      });
    });

    it('merges persisted state with default state', () => {
      const request = getInitRequestMock();
      const persistedState: Partial<PerpsControllerState> = {
        isTestnet: true,
        activeProvider: 'hyperliquid',
      };
      request.persistedState.PerpsController = persistedState;

      PerpsControllerInit(request);

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(constructorCall.state).toEqual(
        expect.objectContaining(persistedState),
      );
    });

    it('calls createPerpsInfrastructure', () => {
      PerpsControllerInit(getInitRequestMock());
      expect(createPerpsInfrastructure).toHaveBeenCalled();
    });
  });

  describe('getFallbackBlockedRegions', () => {
    it('parses MM_PERPS_BLOCKED_REGIONS env var', () => {
      process.env.MM_PERPS_BLOCKED_REGIONS = 'US,CA-ON,GB';
      PerpsControllerInit(getInitRequestMock());

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(constructorCall.clientConfig?.fallbackBlockedRegions).toEqual([
        'US',
        'CA-ON',
        'GB',
      ]);
    });

    it('returns empty array when env var is not set', () => {
      PerpsControllerInit(getInitRequestMock());

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(constructorCall.clientConfig?.fallbackBlockedRegions).toEqual([]);
    });

    it('trims whitespace from region codes', () => {
      process.env.MM_PERPS_BLOCKED_REGIONS = ' US , GB , BE ';
      PerpsControllerInit(getInitRequestMock());

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(constructorCall.clientConfig?.fallbackBlockedRegions).toEqual([
        'US',
        'GB',
        'BE',
      ]);
    });

    it('filters empty strings from region codes', () => {
      process.env.MM_PERPS_BLOCKED_REGIONS = 'US,,GB,';
      PerpsControllerInit(getInitRequestMock());

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(constructorCall.clientConfig?.fallbackBlockedRegions).toEqual([
        'US',
        'GB',
      ]);
    });
  });

  describe('ensureInitialized (via api)', () => {
    it('calls controller.init() on first api call', async () => {
      const request = getInitRequestMock();
      const { api, controller } = initWithApi(request);

      await api.perpsInit();

      expect(controller.init).toHaveBeenCalledTimes(1);
    });

    it('skips init when already initialized', async () => {
      const request = getInitRequestMock();
      const { api, controller } = initWithApi(request);
      (
        controller.state as unknown as Record<string, string>
      ).initializationState = 'initialized';

      await api.perpsInit();

      expect(controller.init).not.toHaveBeenCalled();
    });

    it('reuses the same init promise for concurrent calls', async () => {
      const request = getInitRequestMock();
      const { api, controller } = initWithApi(request);

      await Promise.all([api.perpsInit(), api.perpsInit()]);

      expect(controller.init).toHaveBeenCalledTimes(1);
    });

    it('resets init promise on failure so retry is possible', async () => {
      const request = getInitRequestMock();
      const { api, controller } = initWithApi(request);

      const initMock = jest.mocked(controller.init);
      initMock.mockRejectedValueOnce(new Error('init failed'));

      await expect(api.perpsInit()).rejects.toThrow('init failed');

      initMock.mockResolvedValueOnce(undefined);
      await api.perpsInit();

      expect(controller.init).toHaveBeenCalledTimes(2);
    });
  });

  describe('trading mutation api methods', () => {
    it('perpsPlaceOrder initializes then delegates', async () => {
      const { api, controller } = initWithApi();
      const args = [{ market: 'ETH', size: 1, side: 'buy' }] as never;

      await api.perpsPlaceOrder(
        ...(args as Parameters<typeof api.perpsPlaceOrder>),
      );

      expect(controller.init).toHaveBeenCalled();
      expect(controller.placeOrder).toHaveBeenCalled();
    });

    it('perpsClosePosition initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsClosePosition(
        ...([] as unknown as Parameters<typeof api.perpsClosePosition>),
      );

      expect(controller.init).toHaveBeenCalled();
      expect(controller.closePosition).toHaveBeenCalled();
    });

    it('perpsClosePositions initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsClosePositions(
        ...([] as unknown as Parameters<typeof api.perpsClosePositions>),
      );

      expect(controller.init).toHaveBeenCalled();
      expect(controller.closePositions).toHaveBeenCalled();
    });

    it('perpsEditOrder initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsEditOrder(
        ...([] as unknown as Parameters<typeof api.perpsEditOrder>),
      );

      expect(controller.init).toHaveBeenCalled();
      expect(controller.editOrder).toHaveBeenCalled();
    });

    it('perpsCancelOrder initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsCancelOrder(
        ...([] as unknown as Parameters<typeof api.perpsCancelOrder>),
      );

      expect(controller.init).toHaveBeenCalled();
      expect(controller.cancelOrder).toHaveBeenCalled();
    });

    it('perpsCancelOrders initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsCancelOrders(
        ...([] as unknown as Parameters<typeof api.perpsCancelOrders>),
      );

      expect(controller.init).toHaveBeenCalled();
      expect(controller.cancelOrders).toHaveBeenCalled();
    });

    it('perpsUpdatePositionTPSL initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsUpdatePositionTPSL(
        ...([] as unknown as Parameters<typeof api.perpsUpdatePositionTPSL>),
      );

      expect(controller.init).toHaveBeenCalled();
      expect(controller.updatePositionTPSL).toHaveBeenCalled();
    });

    it('perpsUpdateMargin initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsUpdateMargin(
        ...([] as unknown as Parameters<typeof api.perpsUpdateMargin>),
      );

      expect(controller.init).toHaveBeenCalled();
      expect(controller.updateMargin).toHaveBeenCalled();
    });

    it('perpsFlipPosition initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsFlipPosition(
        ...([] as unknown as Parameters<typeof api.perpsFlipPosition>),
      );

      expect(controller.init).toHaveBeenCalled();
      expect(controller.flipPosition).toHaveBeenCalled();
    });

    it('perpsWithdraw initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsWithdraw(
        ...([] as unknown as Parameters<typeof api.perpsWithdraw>),
      );

      expect(controller.init).toHaveBeenCalled();
      expect(controller.withdraw).toHaveBeenCalled();
    });

    it('perpsDepositWithConfirmation returns lastDepositTransactionId', async () => {
      const { api, controller } = initWithApi();
      (
        controller.state as unknown as Record<string, string>
      ).lastDepositTransactionId = 'tx-123';

      const result = await api.perpsDepositWithConfirmation(
        ...([] as unknown as Parameters<
          typeof controller.depositWithConfirmation
        >),
      );

      expect(controller.depositWithConfirmation).toHaveBeenCalled();
      expect(result).toBe('tx-123');
    });
  });

  describe('data fetch api methods', () => {
    it('perpsGetPositions initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsGetPositions();

      expect(controller.init).toHaveBeenCalled();
      expect(controller.getPositions).toHaveBeenCalled();
    });

    it('perpsGetMarkets initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsGetMarkets();

      expect(controller.init).toHaveBeenCalled();
      expect(controller.getMarkets).toHaveBeenCalled();
    });

    it('perpsGetMarketDataWithPrices initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsGetMarketDataWithPrices();

      expect(controller.init).toHaveBeenCalled();
      expect(controller.getMarketDataWithPrices).toHaveBeenCalled();
    });

    it('perpsGetOrderFills initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsGetOrderFills();

      expect(controller.init).toHaveBeenCalled();
      expect(controller.getOrderFills).toHaveBeenCalled();
    });

    it('perpsGetOrders initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsGetOrders();

      expect(controller.init).toHaveBeenCalled();
      expect(controller.getOrders).toHaveBeenCalled();
    });

    it('perpsGetOpenOrders initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsGetOpenOrders();

      expect(controller.init).toHaveBeenCalled();
      expect(controller.getOpenOrders).toHaveBeenCalled();
    });

    it('perpsGetFunding initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsGetFunding();

      expect(controller.init).toHaveBeenCalled();
      expect(controller.getFunding).toHaveBeenCalled();
    });

    it('perpsGetAccountState initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsGetAccountState();

      expect(controller.init).toHaveBeenCalled();
      expect(controller.getAccountState).toHaveBeenCalled();
    });

    it('perpsGetHistoricalPortfolio initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsGetHistoricalPortfolio(
        ...([] as unknown as Parameters<
          typeof api.perpsGetHistoricalPortfolio
        >),
      );

      expect(controller.init).toHaveBeenCalled();
      expect(controller.getHistoricalPortfolio).toHaveBeenCalled();
    });

    it('perpsFetchHistoricalCandles initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsFetchHistoricalCandles(
        ...([] as unknown as Parameters<
          typeof api.perpsFetchHistoricalCandles
        >),
      );

      expect(controller.init).toHaveBeenCalled();
      expect(controller.fetchHistoricalCandles).toHaveBeenCalled();
    });

    it('perpsCalculateFees initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsCalculateFees(
        ...([] as unknown as Parameters<typeof api.perpsCalculateFees>),
      );

      expect(controller.init).toHaveBeenCalled();
      expect(controller.calculateFees).toHaveBeenCalled();
    });

    it('perpsGetAvailableDexs initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsGetAvailableDexs();

      expect(controller.init).toHaveBeenCalled();
      expect(controller.getAvailableDexs).toHaveBeenCalled();
    });

    it('perpsRefreshEligibility initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsRefreshEligibility();

      expect(controller.init).toHaveBeenCalled();
      expect(controller.refreshEligibility).toHaveBeenCalled();
    });

    it('perpsToggleTestnet initializes then delegates', async () => {
      const { api, controller } = initWithApi();

      await api.perpsToggleTestnet();

      expect(controller.init).toHaveBeenCalled();
      expect(controller.toggleTestnet).toHaveBeenCalled();
    });

    it('perpsGetUserHistory initializes then calls provider', async () => {
      const { api, controller } = initWithApi();
      const params = { startTime: 0 };

      await api.perpsGetUserHistory(params);

      expect(controller.init).toHaveBeenCalled();
      expect(
        controller.getActiveProvider().getUserHistory,
      ).toHaveBeenCalledWith(params);
    });
  });

  describe('synchronous api methods (no init needed)', () => {
    it('perpsDisconnect delegates without init', async () => {
      const { api, controller } = initWithApi();

      await api.perpsDisconnect();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.disconnect).toHaveBeenCalled();
    });

    it('perpsSaveTradeConfiguration delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsSaveTradeConfiguration(
        ...([] as unknown as Parameters<
          typeof api.perpsSaveTradeConfiguration
        >),
      );

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.saveTradeConfiguration).toHaveBeenCalled();
    });

    it('perpsGetTradeConfiguration delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsGetTradeConfiguration(
        ...([] as unknown as Parameters<typeof api.perpsGetTradeConfiguration>),
      );

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.getTradeConfiguration).toHaveBeenCalled();
    });

    it('perpsSavePendingTradeConfiguration delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsSavePendingTradeConfiguration(
        ...([] as unknown as Parameters<
          typeof api.perpsSavePendingTradeConfiguration
        >),
      );

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.savePendingTradeConfiguration).toHaveBeenCalled();
    });

    it('perpsGetPendingTradeConfiguration delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsGetPendingTradeConfiguration();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.getPendingTradeConfiguration).toHaveBeenCalled();
    });

    it('perpsClearPendingTradeConfiguration delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsClearPendingTradeConfiguration();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.clearPendingTradeConfiguration).toHaveBeenCalled();
    });

    it('perpsSaveMarketFilterPreferences delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsSaveMarketFilterPreferences(
        ...([] as unknown as Parameters<
          typeof api.perpsSaveMarketFilterPreferences
        >),
      );

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.saveMarketFilterPreferences).toHaveBeenCalled();
    });

    it('perpsGetMarketFilterPreferences delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsGetMarketFilterPreferences();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.getMarketFilterPreferences).toHaveBeenCalled();
    });

    it('perpsSetSelectedPaymentToken delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsSetSelectedPaymentToken(
        ...([] as unknown as Parameters<
          typeof api.perpsSetSelectedPaymentToken
        >),
      );

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.setSelectedPaymentToken).toHaveBeenCalled();
    });

    it('perpsResetSelectedPaymentToken delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsResetSelectedPaymentToken();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.resetSelectedPaymentToken).toHaveBeenCalled();
    });

    it('perpsMarkTutorialCompleted delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsMarkTutorialCompleted();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.markTutorialCompleted).toHaveBeenCalled();
    });

    it('perpsMarkFirstOrderCompleted delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsMarkFirstOrderCompleted();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.markFirstOrderCompleted).toHaveBeenCalled();
    });

    it('perpsResetFirstTimeUserState delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsResetFirstTimeUserState();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.resetFirstTimeUserState).toHaveBeenCalled();
    });

    it('perpsClearPendingTransactionRequests delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsClearPendingTransactionRequests();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.clearPendingTransactionRequests).toHaveBeenCalled();
    });

    it('perpsSaveOrderBookGrouping delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsSaveOrderBookGrouping(
        ...([] as unknown as Parameters<typeof api.perpsSaveOrderBookGrouping>),
      );

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.saveOrderBookGrouping).toHaveBeenCalled();
    });

    it('perpsGetOrderBookGrouping delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsGetOrderBookGrouping();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.getOrderBookGrouping).toHaveBeenCalled();
    });

    it('perpsClearDepositResult delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsClearDepositResult();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.clearDepositResult).toHaveBeenCalled();
    });

    it('perpsClearWithdrawResult delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsClearWithdrawResult();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.clearWithdrawResult).toHaveBeenCalled();
    });

    it('perpsGetBlockExplorerUrl delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsGetBlockExplorerUrl();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.getBlockExplorerUrl).toHaveBeenCalled();
    });

    it('perpsGetCurrentNetwork delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsGetCurrentNetwork();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.getCurrentNetwork).toHaveBeenCalled();
    });

    it('perpsIsFirstTimeUserOnCurrentNetwork delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsIsFirstTimeUserOnCurrentNetwork();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.isFirstTimeUserOnCurrentNetwork).toHaveBeenCalled();
    });

    it('perpsGetWatchlistMarkets delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsGetWatchlistMarkets();

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.getWatchlistMarkets).toHaveBeenCalled();
    });

    it('perpsToggleWatchlistMarket delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsToggleWatchlistMarket(
        ...([] as unknown as Parameters<typeof api.perpsToggleWatchlistMarket>),
      );

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.toggleWatchlistMarket).toHaveBeenCalled();
    });

    it('perpsIsWatchlistMarket delegates without init', () => {
      const { api, controller } = initWithApi();

      api.perpsIsWatchlistMarket(
        ...([] as unknown as Parameters<typeof api.perpsIsWatchlistMarket>),
      );

      expect(controller.init).not.toHaveBeenCalled();
      expect(controller.isWatchlistMarket).toHaveBeenCalled();
    });
  });
});
