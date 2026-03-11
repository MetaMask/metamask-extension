import {
  PerpsController,
  getDefaultPerpsControllerState,
  type PerpsControllerState,
} from '@metamask/perps-controller';
import { createPerpsInfrastructure } from '../controllers/perps/infrastructure';
import { ControllerApi, ControllerInitFunction } from './types';
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

  const api = getApi(controller);

  return { controller, api };
};

/**
 * All background action names exposed by the Perps API.
 * TypeScript will error at the Record below if any name is missing from getApi().
 */
type PerpsActionName =
  | 'perpsInit'
  | 'perpsDisconnect'
  | 'perpsPlaceOrder'
  | 'perpsClosePosition'
  | 'perpsClosePositions'
  | 'perpsEditOrder'
  | 'perpsCancelOrder'
  | 'perpsCancelOrders'
  | 'perpsUpdatePositionTPSL'
  | 'perpsUpdateMargin'
  | 'perpsFlipPosition'
  | 'perpsWithdraw'
  | 'perpsDepositWithConfirmation'
  | 'perpsGetPositions'
  | 'perpsGetMarkets'
  | 'perpsGetMarketDataWithPrices'
  | 'perpsGetOrderFills'
  | 'perpsGetOrders'
  | 'perpsGetOpenOrders'
  | 'perpsGetFunding'
  | 'perpsGetAccountState'
  | 'perpsGetHistoricalPortfolio'
  | 'perpsFetchHistoricalCandles'
  | 'perpsCalculateFees'
  | 'perpsGetAvailableDexs'
  | 'perpsRefreshEligibility'
  | 'perpsToggleTestnet'
  | 'perpsSaveTradeConfiguration'
  | 'perpsGetTradeConfiguration'
  | 'perpsSavePendingTradeConfiguration'
  | 'perpsGetPendingTradeConfiguration'
  | 'perpsClearPendingTradeConfiguration'
  | 'perpsSaveMarketFilterPreferences'
  | 'perpsGetMarketFilterPreferences'
  | 'perpsSetSelectedPaymentToken'
  | 'perpsResetSelectedPaymentToken'
  | 'perpsMarkTutorialCompleted'
  | 'perpsMarkFirstOrderCompleted'
  | 'perpsResetFirstTimeUserState'
  | 'perpsClearPendingTransactionRequests'
  | 'perpsSaveOrderBookGrouping'
  | 'perpsGetOrderBookGrouping'
  | 'perpsGetUserHistory'
  | 'perpsClearDepositResult'
  | 'perpsClearWithdrawResult'
  | 'perpsGetBlockExplorerUrl'
  | 'perpsGetCurrentNetwork'
  | 'perpsIsFirstTimeUserOnCurrentNetwork'
  | 'perpsGetWatchlistMarkets'
  | 'perpsToggleWatchlistMarket'
  | 'perpsIsWatchlistMarket';

type PerpsBackgroundApi = Record<PerpsActionName, ControllerApi>;

function getApi(controller: PerpsController): PerpsBackgroundApi {
  return {
    // -- Lifecycle --
    perpsInit: controller.init.bind(controller),
    perpsDisconnect: controller.disconnect.bind(controller),

    // -- Trading mutations --
    perpsPlaceOrder: controller.placeOrder.bind(controller),
    perpsClosePosition: controller.closePosition.bind(controller),
    perpsClosePositions: controller.closePositions.bind(controller),
    perpsEditOrder: controller.editOrder.bind(controller),
    perpsCancelOrder: controller.cancelOrder.bind(controller),
    perpsCancelOrders: controller.cancelOrders.bind(controller),
    perpsUpdatePositionTPSL: controller.updatePositionTPSL.bind(controller),
    perpsUpdateMargin: controller.updateMargin.bind(controller),
    perpsFlipPosition: controller.flipPosition.bind(controller),
    perpsWithdraw: controller.withdraw.bind(controller),
    perpsDepositWithConfirmation: async (
      ...args: Parameters<typeof controller.depositWithConfirmation>
    ) => {
      await controller.depositWithConfirmation(...args);
      // TODO: depositWithConfirmation should return the transaction ID
      // directly — that requires a controller package change.
      return controller.state.lastDepositTransactionId;
    },

    // -- Data fetches --
    perpsGetPositions: controller.getPositions.bind(controller),
    perpsGetMarkets: controller.getMarkets.bind(controller),
    perpsGetMarketDataWithPrices:
      controller.getMarketDataWithPrices.bind(controller),
    perpsGetOrderFills: controller.getOrderFills.bind(controller),
    perpsGetOrders: controller.getOrders.bind(controller),
    perpsGetOpenOrders: controller.getOpenOrders.bind(controller),
    perpsGetFunding: controller.getFunding.bind(controller),
    perpsGetAccountState: controller.getAccountState.bind(controller),
    perpsGetHistoricalPortfolio:
      controller.getHistoricalPortfolio.bind(controller),
    perpsFetchHistoricalCandles:
      controller.fetchHistoricalCandles.bind(controller),
    perpsCalculateFees: controller.calculateFees.bind(controller),
    perpsGetAvailableDexs: controller.getAvailableDexs.bind(controller),

    // -- Eligibility --
    perpsRefreshEligibility: controller.refreshEligibility.bind(controller),

    // -- Toggle --
    perpsToggleTestnet: controller.toggleTestnet.bind(controller),

    // -- Preferences --
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
    perpsGetOrderBookGrouping: controller.getOrderBookGrouping.bind(controller),

    // -- Provider passthrough --
    perpsGetUserHistory: async (params: {
      startTime?: number;
      endTime?: number;
      accountId?: `${string}:${string}:${string}`;
    }) => {
      return controller.getActiveProvider().getUserHistory(params);
    },

    // -- Misc --
    perpsClearDepositResult: controller.clearDepositResult.bind(controller),
    perpsClearWithdrawResult: controller.clearWithdrawResult.bind(controller),
    perpsGetBlockExplorerUrl: controller.getBlockExplorerUrl.bind(controller),
    perpsGetCurrentNetwork: controller.getCurrentNetwork.bind(controller),
    perpsIsFirstTimeUserOnCurrentNetwork:
      controller.isFirstTimeUserOnCurrentNetwork.bind(controller),
    perpsGetWatchlistMarkets: controller.getWatchlistMarkets.bind(controller),
    perpsToggleWatchlistMarket:
      controller.toggleWatchlistMarket.bind(controller),
    perpsIsWatchlistMarket: controller.isWatchlistMarket.bind(controller),
  };
}
