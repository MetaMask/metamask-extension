import {
  PerpsController,
  type PerpsControllerState,
  type PerpsPlatformDependencies,
} from '@metamask/perps-controller';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import {
  createPerpsInfrastructure,
  type InfrastructureDeps,
} from '../controllers/perps/infrastructure';
import { buildControllerInitRequestMock } from './test/utils';
import { PerpsControllerInit } from './perps-controller-init';
import type { PerpsControllerMessenger } from './messengers/perps-controller-messenger';
import type { MessengerClientInitRequest } from './types';

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
    cachedMarketDataByProvider: {},
    cachedUserDataByProvider: {},
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
    validateWithdrawal: jest.fn(),
    getWithdrawalRoutes: jest.fn(),
    updateWithdrawalStatus: jest.fn(),
    updateWithdrawalProgress: jest.fn(),
    getWithdrawalProgress: jest.fn(),
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
    calculateLiquidationPrice: jest.fn(),
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
      getUserNonFundingLedgerUpdates: jest.fn(),
    }),
    clearDepositResult: jest.fn(),
    clearWithdrawResult: jest.fn(),
    getBlockExplorerUrl: jest.fn(),
    getCurrentNetwork: jest.fn(),
    isFirstTimeUserOnCurrentNetwork: jest.fn(),
    getWatchlistMarkets: jest.fn(),
    toggleWatchlistMarket: jest.fn(),
    isWatchlistMarket: jest.fn(),
    reconnect: jest.fn().mockResolvedValue(undefined),
    getWebSocketConnectionState: jest.fn().mockReturnValue('connected'),
  })),
}));

jest.mock('../controllers/perps/infrastructure', () => ({
  createPerpsInfrastructure: jest.fn().mockReturnValue({}),
}));

type InitRequest = jest.Mocked<
  MessengerClientInitRequest<PerpsControllerMessenger, undefined>
>;

function getInitRequestMock(): InitRequest {
  return {
    ...buildControllerInitRequestMock(),
    controllerMessenger: {
      call: jest.fn(),
    } as unknown as PerpsControllerMessenger,
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
    delete process.env.MM_PERPS_HL_BUILDER_ADDRESS_MAINNET;
    delete process.env.MM_PERPS_HL_BUILDER_ADDRESS_TESTNET;
  });

  describe('controller instantiation', () => {
    it('returns a controller instance and api', () => {
      const request = getInitRequestMock();
      const result = PerpsControllerInit(request);

      expect(result.messengerClient).toBeDefined();
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
          fallbackHip3AllowlistMarkets: ['xyz:*'],
          fallbackBlockedRegions: [],
        },
        deferEligibilityCheck: true,
      });
    });

    /**
     * Data-layer guard: the UI categorization filter (Stocks/Commodities/Forex)
     * intentionally does NOT re-check the HIP-3 allowlist and trusts the
     * controller to limit which HIP-3 markets reach the UI. If this fallback
     * is ever weakened (e.g. set to []), markets from non-allowlisted DEXes
     * could surface in the UI before LaunchDarkly responds. Lock it in here.
     *
     * See ui/pages/perps/market-list/index.tsx :: filterByType.
     */
    it('always wires a non-empty fallbackHip3AllowlistMarkets so the controller can gate HIP-3 markets before LD loads', () => {
      const request = getInitRequestMock();
      PerpsControllerInit(request);

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      const { clientConfig } = constructorCall;
      expect(clientConfig).toBeDefined();
      if (!clientConfig) {
        return;
      }
      expect(clientConfig.fallbackHip3Enabled).toBe(true);
      expect(clientConfig.fallbackHip3AllowlistMarkets).toEqual(['xyz:*']);
      expect(clientConfig.fallbackHip3AllowlistMarkets).not.toEqual([]);
      expect(clientConfig.fallbackHip3AllowlistMarkets).not.toBeUndefined();
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

    it('calls createPerpsInfrastructure with trackEvent', () => {
      PerpsControllerInit(getInitRequestMock());
      expect(createPerpsInfrastructure).toHaveBeenCalledWith({
        trackEvent: expect.any(Function),
        getStorageItem: expect.any(Function),
        setStorageItem: expect.any(Function),
        removeStorageItem: expect.any(Function),
      });
    });

    it('trackEvent from createPerpsInfrastructure delegates to MetaMetricsController:trackEvent', () => {
      const call = jest.fn();
      const request = getInitRequestMock();
      request.controllerMessenger = {
        call,
      } as unknown as PerpsControllerMessenger;

      jest
        .mocked(createPerpsInfrastructure)
        .mockImplementationOnce((deps: InfrastructureDeps) => {
          deps.trackEvent({
            event: MetaMetricsEventName.PerpsScreenViewed,
            category: MetaMetricsEventCategory.Perps,
            properties: {},
          });
          return {} as PerpsPlatformDependencies;
        });

      PerpsControllerInit(request);

      expect(call).toHaveBeenCalledWith(
        'MetaMetricsController:trackEvent',
        expect.objectContaining({
          event: MetaMetricsEventName.PerpsScreenViewed,
          category: MetaMetricsEventCategory.Perps,
        }),
      );
    });

    it('storage helpers from createPerpsInfrastructure delegate to StorageService', async () => {
      const call = jest.fn().mockResolvedValue({ result: 'cached-value' });
      const request = getInitRequestMock();
      request.controllerMessenger = {
        call,
      } as unknown as PerpsControllerMessenger;
      let capturedDeps: InfrastructureDeps | undefined;

      jest
        .mocked(createPerpsInfrastructure)
        .mockImplementationOnce((deps: InfrastructureDeps) => {
          capturedDeps = deps;
          return {} as PerpsPlatformDependencies;
        });

      PerpsControllerInit(request);
      expect(capturedDeps).toBeDefined();
      const deps = capturedDeps as InfrastructureDeps;

      await deps.getStorageItem('diskCache:PERPS_DISK_CACHE_MARKETS');
      await deps.setStorageItem(
        'diskCache:PERPS_DISK_CACHE_MARKETS',
        'cached-value',
      );
      await deps.removeStorageItem('diskCache:PERPS_DISK_CACHE_MARKETS');

      expect(call).toHaveBeenNthCalledWith(
        1,
        'StorageService:getItem',
        'PerpsController',
        'diskCache:PERPS_DISK_CACHE_MARKETS',
      );
      expect(call).toHaveBeenNthCalledWith(
        2,
        'StorageService:setItem',
        'PerpsController',
        'diskCache:PERPS_DISK_CACHE_MARKETS',
        'cached-value',
      );
      expect(call).toHaveBeenNthCalledWith(
        3,
        'StorageService:removeItem',
        'PerpsController',
        'diskCache:PERPS_DISK_CACHE_MARKETS',
      );
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

  describe('getHyperLiquidBuilderAddresses', () => {
    it('returns undefined when no env vars are set', () => {
      PerpsControllerInit(getInitRequestMock());

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(
        constructorCall.clientConfig?.providerCredentials?.hyperliquid,
      ).toBeUndefined();
    });

    it('passes mainnet builder address from env var', () => {
      process.env.MM_PERPS_HL_BUILDER_ADDRESS_MAINNET = '0xabc123';
      PerpsControllerInit(getInitRequestMock());

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(
        constructorCall.clientConfig?.providerCredentials?.hyperliquid,
      ).toEqual({
        builderAddressMainnet: '0xabc123',
      });
    });

    it('passes testnet builder address from env var', () => {
      process.env.MM_PERPS_HL_BUILDER_ADDRESS_TESTNET = '0xdef456';
      PerpsControllerInit(getInitRequestMock());

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(
        constructorCall.clientConfig?.providerCredentials?.hyperliquid,
      ).toEqual({
        builderAddressTestnet: '0xdef456',
      });
    });

    it('passes both builder addresses when both env vars are set', () => {
      process.env.MM_PERPS_HL_BUILDER_ADDRESS_MAINNET = '0xabc123';
      process.env.MM_PERPS_HL_BUILDER_ADDRESS_TESTNET = '0xdef456';
      PerpsControllerInit(getInitRequestMock());

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(
        constructorCall.clientConfig?.providerCredentials?.hyperliquid,
      ).toEqual({
        builderAddressMainnet: '0xabc123',
        builderAddressTestnet: '0xdef456',
      });
    });

    it('trims whitespace from builder addresses', () => {
      process.env.MM_PERPS_HL_BUILDER_ADDRESS_MAINNET = ' 0xabc123 ';
      process.env.MM_PERPS_HL_BUILDER_ADDRESS_TESTNET = ' 0xdef456 ';
      PerpsControllerInit(getInitRequestMock());

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(
        constructorCall.clientConfig?.providerCredentials?.hyperliquid,
      ).toEqual({
        builderAddressMainnet: '0xabc123',
        builderAddressTestnet: '0xdef456',
      });
    });

    it('omits whitespace-only builder addresses so package defaults still apply', () => {
      process.env.MM_PERPS_HL_BUILDER_ADDRESS_MAINNET = '   ';
      process.env.MM_PERPS_HL_BUILDER_ADDRESS_TESTNET = '\t';
      PerpsControllerInit(getInitRequestMock());

      const constructorCall = PerpsControllerMock.mock.calls[0][0];
      expect(
        constructorCall.clientConfig?.providerCredentials?.hyperliquid,
      ).toBeUndefined();
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
      ['perpsValidateWithdrawal', 'validateWithdrawal'],
      ['perpsGetWithdrawalRoutes', 'getWithdrawalRoutes'],
      ['perpsUpdateWithdrawalStatus', 'updateWithdrawalStatus'],
      ['perpsUpdateWithdrawalProgress', 'updateWithdrawalProgress'],
      ['perpsGetWithdrawalProgress', 'getWithdrawalProgress'],
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
      ['perpsCalculateLiquidationPrice', 'calculateLiquidationPrice'],
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
      it(`${apiMethod} delegates to messengerClient.${controllerMethod}`, async () => {
        const { api, messengerClient } = initWithApi();

        await (api as Record<string, CallableFunction>)[apiMethod]();

        expect(
          (messengerClient as unknown as Record<string, jest.Mock>)[
            controllerMethod
          ],
        ).toHaveBeenCalled();
      });
    }

    it('perpsDepositWithConfirmation returns lastDepositTransactionId', async () => {
      const { api, messengerClient } = initWithApi();
      (
        messengerClient.state as unknown as Record<string, string>
      ).lastDepositTransactionId = 'tx-123';

      const result = await api.perpsDepositWithConfirmation(
        ...([] as unknown as Parameters<
          typeof messengerClient.depositWithConfirmation
        >),
      );

      expect(messengerClient.depositWithConfirmation).toHaveBeenCalled();
      expect(result).toBe('tx-123');
    });

    it('perpsGetUserHistory calls provider.getUserHistory', async () => {
      const { api, messengerClient } = initWithApi();
      const params = { startTime: 0 };

      await api.perpsGetUserHistory(params);

      expect(
        messengerClient.getActiveProvider().getUserHistory,
      ).toHaveBeenCalledWith(params);
    });

    it('perpsGetUserNonFundingLedgerUpdates calls provider.getUserNonFundingLedgerUpdates', async () => {
      const { api, messengerClient } = initWithApi();
      const params = { startTime: 0 };

      await api.perpsGetUserNonFundingLedgerUpdates(params);

      expect(
        messengerClient.getActiveProvider().getUserNonFundingLedgerUpdates,
      ).toHaveBeenCalledWith(params);
    });
  });

  describe('withAutoInit recovery', () => {
    it('retries after CLIENT_NOT_INITIALIZED and succeeds', async () => {
      const { api, messengerClient } = initWithApi();
      const getPositions = messengerClient.getPositions as jest.Mock;
      getPositions
        .mockRejectedValueOnce(new Error('CLIENT_NOT_INITIALIZED'))
        .mockResolvedValueOnce([{ symbol: 'ETH' }]);

      const result = await api.perpsGetPositions();

      expect(messengerClient.init).toHaveBeenCalledTimes(1);
      expect(getPositions).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ symbol: 'ETH' }]);
    });

    it('retries after CLIENT_REINITIALIZING and succeeds', async () => {
      const { api, messengerClient } = initWithApi();
      const getMarkets = messengerClient.getMarkets as jest.Mock;
      getMarkets
        .mockRejectedValueOnce(new Error('CLIENT_REINITIALIZING'))
        .mockResolvedValueOnce([{ market: 'BTC' }]);

      const result = await api.perpsGetMarkets();

      expect(messengerClient.init).toHaveBeenCalledTimes(1);
      expect(getMarkets).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ market: 'BTC' }]);
    });

    it('does not retry for unrelated errors', async () => {
      const { api, messengerClient } = initWithApi();
      const getPositions = messengerClient.getPositions as jest.Mock;
      getPositions.mockRejectedValueOnce(new Error('NETWORK_ERROR'));

      await expect(api.perpsGetPositions()).rejects.toThrow('NETWORK_ERROR');
      expect(messengerClient.init).not.toHaveBeenCalled();
      expect(getPositions).toHaveBeenCalledTimes(1);
    });

    it('does not wrap lifecycle methods (perpsInit)', async () => {
      const { api, messengerClient } = initWithApi();
      const init = messengerClient.init as jest.Mock;
      init.mockRejectedValueOnce(new Error('CLIENT_NOT_INITIALIZED'));

      // perpsInit should NOT auto-retry — it IS the init
      await expect(api.perpsInit()).rejects.toThrow('CLIENT_NOT_INITIALIZED');
      expect(init).toHaveBeenCalledTimes(1);
    });

    it('does not wrap preference methods (perpsSaveTradeConfiguration)', async () => {
      const { api, messengerClient } = initWithApi();
      const save = messengerClient.saveTradeConfiguration as jest.Mock;
      save.mockRejectedValueOnce(new Error('CLIENT_NOT_INITIALIZED'));

      // Preferences are state-only — should NOT auto-retry
      await expect(
        api.perpsSaveTradeConfiguration(
          ...([] as unknown as Parameters<
            typeof messengerClient.saveTradeConfiguration
          >),
        ),
      ).rejects.toThrow('CLIENT_NOT_INITIALIZED');
      expect(messengerClient.init).not.toHaveBeenCalled();
    });

    it('recovers provider passthrough (perpsGetUserHistory)', async () => {
      const { api, messengerClient } = initWithApi();
      const getUserHistory = messengerClient.getActiveProvider()
        .getUserHistory as jest.Mock;
      getUserHistory
        .mockRejectedValueOnce(new Error('CLIENT_NOT_INITIALIZED'))
        .mockResolvedValueOnce([{ id: 'h1' }]);

      const result = await api.perpsGetUserHistory({ startTime: 0 });

      expect(messengerClient.init).toHaveBeenCalledTimes(1);
      expect(result).toEqual([{ id: 'h1' }]);
    });

    it('recovers trading mutations (perpsPlaceOrder)', async () => {
      const { api, messengerClient } = initWithApi();
      const placeOrder = messengerClient.placeOrder as jest.Mock;
      placeOrder
        .mockRejectedValueOnce(new Error('CLIENT_NOT_INITIALIZED'))
        .mockResolvedValueOnce({ orderId: '123' });

      const result = await api.perpsPlaceOrder(
        ...([] as unknown as Parameters<typeof messengerClient.placeOrder>),
      );

      expect(messengerClient.init).toHaveBeenCalledTimes(1);
      expect(placeOrder).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ orderId: '123' });
    });
  });
});
