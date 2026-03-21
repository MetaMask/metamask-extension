import {
  PerpsController,
  type PerpsControllerState,
} from '@metamask/perps-controller';
import { createPerpsInfrastructure } from '../controllers/perps/infrastructure';
import { buildControllerInitRequestMock } from './test/utils';
import { PerpsControllerInit } from './perps-controller-init';
import type { PerpsControllerMessenger } from './messengers/perps-controller-messenger';
import type { ControllerInitRequest } from './types';

jest.mock('@metamask/perps-controller', () => ({
  getDefaultPerpsControllerState: jest.fn().mockReturnValue({
    activeProvider: 'hyperliquid',
    isTestnet: false,
    initializationState: 'uninitialized',
    initializationError: null,
    initializationAttempts: 0,
    accountState: null,
    perpsBalances: {},
    depositInProgress: false,
    lastDepositResult: null,
    withdrawInProgress: false,
    lastDepositTransactionId: null,
    lastWithdrawResult: null,
    withdrawalRequests: [],
    withdrawalProgress: {
      progress: 0,
      lastUpdated: 0,
      activeWithdrawalId: null,
    },
    depositRequests: [],
    lastError: null,
    lastUpdateTimestamp: 0,
    isEligible: false,
    isFirstTimeUser: { testnet: true, mainnet: true },
    hasPlacedFirstOrder: { testnet: false, mainnet: false },
    watchlistMarkets: { testnet: [], mainnet: [] },
    tradeConfigurations: { testnet: {}, mainnet: {} },
    marketFilterPreferences: { optionId: 'volume', direction: 'desc' },
    hip3ConfigVersion: 0,
    selectedPaymentToken: null,
    cachedMarketData: null,
    cachedMarketDataTimestamp: 0,
    cachedPositions: null,
    cachedOrders: null,
    cachedAccountState: null,
    cachedUserDataTimestamp: 0,
    cachedUserDataAddress: null,
  }),
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
    startEligibilityMonitoring: jest.fn(),
    stopEligibilityMonitoring: jest.fn(),
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
}));

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
        state: undefined,
        infrastructure: expect.any(Object),
        clientConfig: {
          fallbackHip3Enabled: true,
          fallbackHip3AllowlistMarkets: [],
          fallbackBlockedRegions: [],
        },
        deferEligibilityCheck: true,
      });
    });

    it('passes deferEligibilityCheck true when onboarding is not complete', () => {
      const request = getInitRequestMock();
      request.persistedState.OnboardingController = {
        completedOnboarding: false,
      } as never;

      PerpsControllerInit(request);

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(constructorCall.deferEligibilityCheck).toBe(true);
    });

    it('passes deferEligibilityCheck true when onboarding is complete', () => {
      const request = getInitRequestMock();
      request.persistedState.OnboardingController = {
        completedOnboarding: true,
      } as never;

      PerpsControllerInit(request);

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(constructorCall.deferEligibilityCheck).toBe(true);
    });

    it('passes deferEligibilityCheck true when basic functionality is off', () => {
      const request = getInitRequestMock();
      request.persistedState.OnboardingController = {
        completedOnboarding: true,
      } as never;
      request.persistedState.PreferencesController = {
        useExternalServices: false,
      } as never;

      PerpsControllerInit(request);

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(constructorCall.deferEligibilityCheck).toBe(true);
    });

    it('passes deferEligibilityCheck false when basic functionality is on and onboarding complete', () => {
      const request = getInitRequestMock();
      request.persistedState.OnboardingController = {
        completedOnboarding: true,
      } as never;
      request.persistedState.PreferencesController = {
        useExternalServices: true,
      } as never;

      PerpsControllerInit(request);

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(constructorCall.deferEligibilityCheck).toBe(false);
    });

    it('defers eligibility check when PreferencesController is undefined (conservative: assume opt-out)', () => {
      const request = getInitRequestMock();
      request.persistedState.OnboardingController = {
        completedOnboarding: true,
      } as never;
      expect(request.persistedState.PreferencesController).toBeUndefined();

      PerpsControllerInit(request);

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(constructorCall.deferEligibilityCheck).toBe(true);
    });

    it('passes persisted state directly to the controller', () => {
      const request = getInitRequestMock();
      const persistedState: Partial<PerpsControllerState> = {
        isTestnet: true,
        activeProvider: 'hyperliquid',
      };
      request.persistedState.PerpsController = persistedState;

      PerpsControllerInit(request);

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(constructorCall.state).toBe(persistedState);
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

  describe('api method delegation', () => {
    const apiToController: [string, string][] = [
      ['perpsInit', 'init'],
      ['perpsDisconnect', 'disconnect'],
      ['perpsPlaceOrder', 'placeOrder'],
      ['perpsClosePosition', 'closePosition'],
      ['perpsClosePositions', 'closePositions'],
      ['perpsEditOrder', 'editOrder'],
      ['perpsCancelOrder', 'cancelOrder'],
      ['perpsCancelOrders', 'cancelOrders'],
      ['perpsUpdatePositionTPSL', 'updatePositionTPSL'],
      ['perpsUpdateMargin', 'updateMargin'],
      ['perpsFlipPosition', 'flipPosition'],
      ['perpsWithdraw', 'withdraw'],
      ['perpsGetPositions', 'getPositions'],
      ['perpsGetMarkets', 'getMarkets'],
      ['perpsGetMarketDataWithPrices', 'getMarketDataWithPrices'],
      ['perpsGetOrderFills', 'getOrderFills'],
      ['perpsGetOrders', 'getOrders'],
      ['perpsGetOpenOrders', 'getOpenOrders'],
      ['perpsGetFunding', 'getFunding'],
      ['perpsGetAccountState', 'getAccountState'],
      ['perpsGetHistoricalPortfolio', 'getHistoricalPortfolio'],
      ['perpsFetchHistoricalCandles', 'fetchHistoricalCandles'],
      ['perpsCalculateFees', 'calculateFees'],
      ['perpsGetAvailableDexs', 'getAvailableDexs'],
      ['perpsRefreshEligibility', 'refreshEligibility'],
      ['perpsStartEligibilityMonitoring', 'startEligibilityMonitoring'],
      ['perpsStopEligibilityMonitoring', 'stopEligibilityMonitoring'],
      ['perpsToggleTestnet', 'toggleTestnet'],
      ['perpsSaveTradeConfiguration', 'saveTradeConfiguration'],
      ['perpsGetTradeConfiguration', 'getTradeConfiguration'],
      ['perpsSavePendingTradeConfiguration', 'savePendingTradeConfiguration'],
      ['perpsGetPendingTradeConfiguration', 'getPendingTradeConfiguration'],
      ['perpsClearPendingTradeConfiguration', 'clearPendingTradeConfiguration'],
      ['perpsSaveMarketFilterPreferences', 'saveMarketFilterPreferences'],
      ['perpsGetMarketFilterPreferences', 'getMarketFilterPreferences'],
      ['perpsSetSelectedPaymentToken', 'setSelectedPaymentToken'],
      ['perpsResetSelectedPaymentToken', 'resetSelectedPaymentToken'],
      ['perpsMarkTutorialCompleted', 'markTutorialCompleted'],
      ['perpsMarkFirstOrderCompleted', 'markFirstOrderCompleted'],
      ['perpsResetFirstTimeUserState', 'resetFirstTimeUserState'],
      [
        'perpsClearPendingTransactionRequests',
        'clearPendingTransactionRequests',
      ],
      ['perpsSaveOrderBookGrouping', 'saveOrderBookGrouping'],
      ['perpsGetOrderBookGrouping', 'getOrderBookGrouping'],
      ['perpsClearDepositResult', 'clearDepositResult'],
      ['perpsClearWithdrawResult', 'clearWithdrawResult'],
      ['perpsGetBlockExplorerUrl', 'getBlockExplorerUrl'],
      ['perpsGetCurrentNetwork', 'getCurrentNetwork'],
      [
        'perpsIsFirstTimeUserOnCurrentNetwork',
        'isFirstTimeUserOnCurrentNetwork',
      ],
      ['perpsGetWatchlistMarkets', 'getWatchlistMarkets'],
      ['perpsToggleWatchlistMarket', 'toggleWatchlistMarket'],
      ['perpsIsWatchlistMarket', 'isWatchlistMarket'],
    ];

    for (const [apiMethod, controllerMethod] of apiToController) {
      it(`${apiMethod} delegates to controller.${controllerMethod}`, async () => {
        const { api, controller } = initWithApi();

        await (api as Record<string, CallableFunction>)[apiMethod]();

        expect(
          (controller as unknown as Record<string, jest.Mock>)[
            controllerMethod
          ],
        ).toHaveBeenCalled();
      });
    }

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

    it('perpsGetUserHistory calls provider.getUserHistory', async () => {
      const { api, controller } = initWithApi();
      const params = { startTime: 0 };

      await api.perpsGetUserHistory(params);

      expect(
        controller.getActiveProvider().getUserHistory,
      ).toHaveBeenCalledWith(params);
    });
  });
});
