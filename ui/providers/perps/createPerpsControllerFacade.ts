/**
 * Perps Controller Facade (Option B)
 *
 * Wraps the UI-side streaming PerpsController so that:
 * - Streaming methods (subscribeToPositions, subscribeToPrices, etc.) are forwarded
 *   to the real controller (callbacks stay UI-side).
 * - All other methods (placeOrder, updateMargin, getPositions, etc.) delegate to
 *   the background controller via submitRequestToBackground('perpsX', [args]).
 *
 * This allows UI code to call controller.placeOrder(...) instead of
 * submitRequestToBackground('perpsPlaceOrder', [...]). State reads should still
 * use Redux selectors from ui/selectors/perps-controller.ts.
 */

import type { PerpsController } from '@metamask/perps-controller';
import { submitRequestToBackground } from '../../store/background-connection';

const STREAMING_METHODS = [
  'subscribeToPositions',
  'subscribeToOrders',
  'subscribeToAccount',
  'subscribeToPrices',
  'subscribeToOrderBook',
  'subscribeToOrderFills',
  'subscribeToCandles',
] as const;

/**
 * Map from facade method name (camelCase) to background action name (perpsPascalCase).
 * Methods not listed here are either streaming (forwarded) or use special handling below.
 */
const DELEGATE_ACTIONS: Record<string, string> = {
  init: 'perpsInit',
  placeOrder: 'perpsPlaceOrder',
  closePosition: 'perpsClosePosition',
  closePositions: 'perpsClosePositions',
  editOrder: 'perpsEditOrder',
  cancelOrder: 'perpsCancelOrder',
  cancelOrders: 'perpsCancelOrders',
  updatePositionTPSL: 'perpsUpdatePositionTPSL',
  updateMargin: 'perpsUpdateMargin',
  flipPosition: 'perpsFlipPosition',
  withdraw: 'perpsWithdraw',
  getPositions: 'perpsGetPositions',
  getMarkets: 'perpsGetMarkets',
  getMarketDataWithPrices: 'perpsGetMarketDataWithPrices',
  getOrderFills: 'perpsGetOrderFills',
  getOrders: 'perpsGetOrders',
  getOpenOrders: 'perpsGetOpenOrders',
  getFunding: 'perpsGetFunding',
  getAccountState: 'perpsGetAccountState',
  getHistoricalPortfolio: 'perpsGetHistoricalPortfolio',
  fetchHistoricalCandles: 'perpsFetchHistoricalCandles',
  calculateFees: 'perpsCalculateFees',
  getAvailableDexs: 'perpsGetAvailableDexs',
  refreshEligibility: 'perpsRefreshEligibility',
  toggleTestnet: 'perpsToggleTestnet',
  saveTradeConfiguration: 'perpsSaveTradeConfiguration',
  getTradeConfiguration: 'perpsGetTradeConfiguration',
  savePendingTradeConfiguration: 'perpsSavePendingTradeConfiguration',
  getPendingTradeConfiguration: 'perpsGetPendingTradeConfiguration',
  clearPendingTradeConfiguration: 'perpsClearPendingTradeConfiguration',
  saveMarketFilterPreferences: 'perpsSaveMarketFilterPreferences',
  getMarketFilterPreferences: 'perpsGetMarketFilterPreferences',
  setSelectedPaymentToken: 'perpsSetSelectedPaymentToken',
  resetSelectedPaymentToken: 'perpsResetSelectedPaymentToken',
  markTutorialCompleted: 'perpsMarkTutorialCompleted',
  markFirstOrderCompleted: 'perpsMarkFirstOrderCompleted',
  resetFirstTimeUserState: 'perpsResetFirstTimeUserState',
  clearPendingTransactionRequests: 'perpsClearPendingTransactionRequests',
  saveOrderBookGrouping: 'perpsSaveOrderBookGrouping',
  getOrderBookGrouping: 'perpsGetOrderBookGrouping',
  getUserHistory: 'perpsGetUserHistory',
  clearDepositResult: 'perpsClearDepositResult',
  clearWithdrawResult: 'perpsClearWithdrawResult',
  getBlockExplorerUrl: 'perpsGetBlockExplorerUrl',
  getCurrentNetwork: 'perpsGetCurrentNetwork',
  isFirstTimeUserOnCurrentNetwork: 'perpsIsFirstTimeUserOnCurrentNetwork',
  getWatchlistMarkets: 'perpsGetWatchlistMarkets',
  toggleWatchlistMarket: 'perpsToggleWatchlistMarket',
  isWatchlistMarket: 'perpsIsWatchlistMarket',
};

function createDelegateMethod<T>(actionName: string): (...args: unknown[]) => Promise<T> {
  return (...args: unknown[]) =>
    submitRequestToBackground<T>(actionName as 'perpsInit', args);
}

/**
 * Creates a facade around the streaming PerpsController. Streaming methods are
 * forwarded to the real controller; all other methods delegate to the background
 * via submitRequestToBackground.
 *
 * @param streamingController - The UI-side streaming controller instance
 * @returns An object compatible with PerpsController for UI use
 */
export function createPerpsControllerFacade(
  streamingController: PerpsController,
): PerpsController {
  const facade = {
    get state() {
      return streamingController.state;
    },

    get messenger() {
      return streamingController.messenger;
    },

    init: createDelegateMethod<void>('perpsInit'),

    disconnect: () => streamingController.disconnect(),

    depositWithConfirmation: async (...args: unknown[]) => {
      const transactionId = await submitRequestToBackground<string | null>(
        'perpsDepositWithConfirmation',
        args,
      );
      return transactionId;
    },
  } as Record<string, unknown>;

  for (const method of STREAMING_METHODS) {
    const fn = (streamingController as Record<string, unknown>)[method];
    if (typeof fn === 'function') {
      facade[method] = fn.bind(streamingController);
    }
  }

  for (const [methodName, actionName] of Object.entries(DELEGATE_ACTIONS)) {
    if (methodName === 'init') {
      continue;
    }
    if (facade[methodName] !== undefined) {
      continue;
    }
    facade[methodName] = createDelegateMethod(actionName);
  }

  return facade as PerpsController;
}
