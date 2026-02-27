import {
  PerpsController,
  getDefaultPerpsControllerState,
  type PerpsControllerState,
} from '@metamask/perps-controller';
import { createPerpsInfrastructure } from '../controllers/perps/infrastructure';
import { ControllerInitFunction, ControllerInitResult } from './types';
import { PerpsControllerMessenger } from './messengers/perps-controller-messenger';

/**
 * Parse fallback blocked regions from MM_PERPS_BLOCKED_REGIONS env var.
 * Format: comma-separated region codes (e.g., "US,CA-ON,GB,BE").
 */
function getFallbackBlockedRegions(): string[] {
  const raw = process.env.MM_PERPS_BLOCKED_REGIONS;
  if (!raw || typeof raw !== 'string') {
    return [];
  }
  return raw
    .split(',')
    .map((r) => r.trim())
    .filter(Boolean);
}

export const PerpsControllerInit: ControllerInitFunction<
  PerpsController,
  PerpsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const infrastructure = createPerpsInfrastructure();
  const fallbackBlockedRegions = getFallbackBlockedRegions();

  const controller = new PerpsController({
    messenger: controllerMessenger,
    state: {
      ...getDefaultPerpsControllerState(),
      ...(persistedState.PerpsController as Partial<PerpsControllerState>),
    },
    infrastructure,
    clientConfig: {
      fallbackHip3Enabled: true,
      fallbackHip3AllowlistMarkets: [],
      fallbackBlockedRegions,
    },
  });

  let initPromise: Promise<void> | null = null;

  /**
   * Lazy-init the controller on first API call.
   * Connects to HyperLiquid WebSocket and fetches initial data.
   */
  const ensureInitialized = async (): Promise<void> => {
    if (controller.state.initializationState === 'initialized') {
      return;
    }
    if (!initPromise) {
      initPromise = controller.init().catch((error) => {
        initPromise = null;
        throw error;
      });
    }
    return initPromise;
  };

  const api = getApi(controller, ensureInitialized);

  return { controller, api };
};

function getApi(
  controller: PerpsController,
  ensureInitialized: () => Promise<void>,
): ControllerInitResult<PerpsController>['api'] {
  return {
    // -- Lifecycle --
    perpsInit: async () => ensureInitialized(),
    perpsDisconnect: controller.disconnect.bind(controller),

    // -- Trading mutations --
    perpsPlaceOrder: async (...args: Parameters<typeof controller.placeOrder>) => {
      await ensureInitialized();
      return controller.placeOrder(...args);
    },
    perpsClosePosition: async (
      ...args: Parameters<typeof controller.closePosition>
    ) => {
      await ensureInitialized();
      return controller.closePosition(...args);
    },
    perpsClosePositions: async (
      ...args: Parameters<typeof controller.closePositions>
    ) => {
      await ensureInitialized();
      return controller.closePositions(...args);
    },
    perpsEditOrder: async (
      ...args: Parameters<typeof controller.editOrder>
    ) => {
      await ensureInitialized();
      return controller.editOrder(...args);
    },
    perpsCancelOrder: async (
      ...args: Parameters<typeof controller.cancelOrder>
    ) => {
      await ensureInitialized();
      return controller.cancelOrder(...args);
    },
    perpsCancelOrders: async (
      ...args: Parameters<typeof controller.cancelOrders>
    ) => {
      await ensureInitialized();
      return controller.cancelOrders(...args);
    },
    perpsUpdatePositionTPSL: async (
      ...args: Parameters<typeof controller.updatePositionTPSL>
    ) => {
      await ensureInitialized();
      return controller.updatePositionTPSL(...args);
    },
    perpsUpdateMargin: async (
      ...args: Parameters<typeof controller.updateMargin>
    ) => {
      await ensureInitialized();
      return controller.updateMargin(...args);
    },
    perpsFlipPosition: async (
      ...args: Parameters<typeof controller.flipPosition>
    ) => {
      await ensureInitialized();
      return controller.flipPosition(...args);
    },
    perpsWithdraw: async (
      ...args: Parameters<typeof controller.withdraw>
    ) => {
      await ensureInitialized();
      return controller.withdraw(...args);
    },
    perpsDepositWithConfirmation: async (
      ...args: Parameters<typeof controller.depositWithConfirmation>
    ) => {
      await ensureInitialized();
      await controller.depositWithConfirmation(...args);
      return controller.state.lastDepositTransactionId;
    },

    // -- Data fetches --
    perpsGetPositions: async (
      ...args: Parameters<typeof controller.getPositions>
    ) => {
      await ensureInitialized();
      return controller.getPositions(...args);
    },
    perpsGetMarkets: async (
      ...args: Parameters<typeof controller.getMarkets>
    ) => {
      await ensureInitialized();
      return controller.getMarkets(...args);
    },
    perpsGetMarketDataWithPrices: async (
      ...args: Parameters<typeof controller.getMarketDataWithPrices>
    ) => {
      await ensureInitialized();
      return controller.getMarketDataWithPrices(...args);
    },
    perpsGetOrderFills: async (
      ...args: Parameters<typeof controller.getOrderFills>
    ) => {
      await ensureInitialized();
      return controller.getOrderFills(...args);
    },
    perpsGetOrders: async (
      ...args: Parameters<typeof controller.getOrders>
    ) => {
      await ensureInitialized();
      return controller.getOrders(...args);
    },
    perpsGetOpenOrders: async (
      ...args: Parameters<typeof controller.getOpenOrders>
    ) => {
      await ensureInitialized();
      return controller.getOpenOrders(...args);
    },
    perpsGetFunding: async (
      ...args: Parameters<typeof controller.getFunding>
    ) => {
      await ensureInitialized();
      return controller.getFunding(...args);
    },
    perpsGetAccountState: async (
      ...args: Parameters<typeof controller.getAccountState>
    ) => {
      await ensureInitialized();
      return controller.getAccountState(...args);
    },
    perpsGetHistoricalPortfolio: async (
      ...args: Parameters<typeof controller.getHistoricalPortfolio>
    ) => {
      await ensureInitialized();
      return controller.getHistoricalPortfolio(...args);
    },
    perpsFetchHistoricalCandles: async (
      ...args: Parameters<typeof controller.fetchHistoricalCandles>
    ) => {
      await ensureInitialized();
      return controller.fetchHistoricalCandles(...args);
    },
    perpsCalculateFees: async (
      ...args: Parameters<typeof controller.calculateFees>
    ) => {
      await ensureInitialized();
      return controller.calculateFees(...args);
    },
    perpsGetAvailableDexs: async (
      ...args: Parameters<typeof controller.getAvailableDexs>
    ) => {
      await ensureInitialized();
      return controller.getAvailableDexs(...args);
    },

    // -- Eligibility --
    perpsRefreshEligibility: async () => {
      await ensureInitialized();
      return controller.refreshEligibility();
    },

    // -- Toggle --
    perpsToggleTestnet: async () => {
      await ensureInitialized();
      return controller.toggleTestnet();
    },

    // -- Preferences (synchronous, no init needed) --
    perpsSaveTradeConfiguration:
      controller.saveTradeConfiguration.bind(controller),
    perpsGetTradeConfiguration:
      controller.getTradeConfiguration.bind(controller),
    perpsSavePendingTradeConfiguration:
      controller.savePendingTradeConfiguration.bind(controller),
    perpsGetPendingTradeConfiguration:
      controller.getPendingTradeConfiguration.bind(controller),
    perpsClearPendingTradeConfiguration:
      controller.clearPendingTradeConfiguration.bind(controller),
    perpsSaveMarketFilterPreferences:
      controller.saveMarketFilterPreferences.bind(controller),
    perpsGetMarketFilterPreferences:
      controller.getMarketFilterPreferences.bind(controller),
    perpsSetSelectedPaymentToken:
      controller.setSelectedPaymentToken.bind(controller),
    perpsResetSelectedPaymentToken:
      controller.resetSelectedPaymentToken.bind(controller),
    perpsMarkTutorialCompleted:
      controller.markTutorialCompleted.bind(controller),
    perpsMarkFirstOrderCompleted:
      controller.markFirstOrderCompleted.bind(controller),
    perpsResetFirstTimeUserState:
      controller.resetFirstTimeUserState.bind(controller),
    perpsClearPendingTransactionRequests:
      controller.clearPendingTransactionRequests.bind(controller),
    perpsSaveOrderBookGrouping:
      controller.saveOrderBookGrouping.bind(controller),
    perpsGetOrderBookGrouping:
      controller.getOrderBookGrouping.bind(controller),

    // -- Provider passthrough (methods that live on the provider, not the controller) --
    perpsGetUserHistory: async (
      params: { startTime?: number; endTime?: number; accountId?: string },
    ) => {
      await ensureInitialized();
      return controller.getActiveProvider().getUserHistory(params);
    },

    // -- Misc --
    perpsClearDepositResult: controller.clearDepositResult.bind(controller),
    perpsClearWithdrawResult: controller.clearWithdrawResult.bind(controller),
    perpsGetBlockExplorerUrl: controller.getBlockExplorerUrl.bind(controller),
    perpsGetCurrentNetwork: controller.getCurrentNetwork.bind(controller),
    perpsIsFirstTimeUserOnCurrentNetwork:
      controller.isFirstTimeUserOnCurrentNetwork.bind(controller),
    perpsGetWatchlistMarkets:
      controller.getWatchlistMarkets.bind(controller),
    perpsToggleWatchlistMarket:
      controller.toggleWatchlistMarket.bind(controller),
    perpsIsWatchlistMarket: controller.isWatchlistMarket.bind(controller),
  };
}
