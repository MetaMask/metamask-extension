/**
 * Single source of truth for the mapping between PerpsController method names
 * and background API action names.
 *
 * Both the UI facade (createPerpsControllerFacade.ts) and the background API
 * (perps-controller-init.ts) derive from this constant. If a method is added
 * to one side but not the other, TypeScript will catch the drift at compile
 * time rather than surfacing it as a runtime failure.
 *
 * Methods that the UI handles specially (streaming, disconnect,
 * depositWithConfirmation) are still listed here so the background API type
 * remains complete.
 */
export const PERPS_API_METHOD_MAP = {
  // -- Lifecycle --
  init: 'perpsInit',
  disconnect: 'perpsDisconnect',

  // -- Trading mutations --
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
  depositWithConfirmation: 'perpsDepositWithConfirmation',

  // -- Data fetches --
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

  // -- Eligibility --
  refreshEligibility: 'perpsRefreshEligibility',

  // -- Toggle --
  toggleTestnet: 'perpsToggleTestnet',

  // -- Preferences --
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

  // -- Provider passthrough --
  getUserHistory: 'perpsGetUserHistory',

  // -- Misc --
  clearDepositResult: 'perpsClearDepositResult',
  clearWithdrawResult: 'perpsClearWithdrawResult',
  getBlockExplorerUrl: 'perpsGetBlockExplorerUrl',
  getCurrentNetwork: 'perpsGetCurrentNetwork',
  isFirstTimeUserOnCurrentNetwork: 'perpsIsFirstTimeUserOnCurrentNetwork',
  getWatchlistMarkets: 'perpsGetWatchlistMarkets',
  toggleWatchlistMarket: 'perpsToggleWatchlistMarket',
  isWatchlistMarket: 'perpsIsWatchlistMarket',
} as const;

/**
 * A controller method name (e.g. `placeOrder`).
 */
export type PerpsMethodName = keyof typeof PERPS_API_METHOD_MAP;

/**
 * A background action name (e.g. `perpsPlaceOrder`).
 */
export type PerpsActionName = (typeof PERPS_API_METHOD_MAP)[PerpsMethodName];
