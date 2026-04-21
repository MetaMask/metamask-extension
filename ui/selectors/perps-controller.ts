import type { PerpsControllerState } from '@metamask/perps-controller';

/**
 * The PerpsController state is flattened into state.metamask by
 * ComposableObservableStore.getFlatState(). All properties live directly
 * on state.metamask, NOT nested under state.metamask.PerpsController.
 */
export type PerpsState = {
  metamask: Partial<PerpsControllerState>;
};

const EMPTY_ARRAY: never[] = [];
const EMPTY_TRADE_CONFIGURATIONS: PerpsControllerState['tradeConfigurations'] =
  { testnet: {}, mainnet: {} };

const DEFAULT_HAS_PLACED_FIRST_ORDER: PerpsControllerState['hasPlacedFirstOrder'] =
  { testnet: false, mainnet: false };
const DEFAULT_WATCHLIST_MARKETS: PerpsControllerState['watchlistMarkets'] = {
  testnet: EMPTY_ARRAY,
  mainnet: EMPTY_ARRAY,
};

export const selectPerpsIsEligible = (state: PerpsState): boolean =>
  state.metamask.isEligible ?? false;

export const selectPerpsInitializationState = (state: PerpsState) =>
  state.metamask.initializationState ?? 'uninitialized';

export const selectPerpsInitializationError = (state: PerpsState) =>
  state.metamask.initializationError ?? null;

export const selectPerpsIsTestnet = (state: PerpsState): boolean =>
  state.metamask.isTestnet ?? false;

export const selectPerpsActiveProvider = (state: PerpsState) =>
  state.metamask.activeProvider ?? 'hyperliquid';

export const selectPerpsDepositInProgress = (state: PerpsState): boolean =>
  state.metamask.depositInProgress ?? false;

export const selectPerpsLastDepositTransactionId = (state: PerpsState) =>
  state.metamask.lastDepositTransactionId ?? null;

export const selectPerpsLastDepositResult = (state: PerpsState) =>
  state.metamask.lastDepositResult ?? null;

export const selectPerpsWithdrawInProgress = (state: PerpsState): boolean =>
  state.metamask.withdrawInProgress ?? false;

export const selectPerpsLastWithdrawResult = (state: PerpsState) =>
  state.metamask.lastWithdrawResult ?? null;

export const selectPerpsWithdrawalRequests = (state: PerpsState) =>
  state.metamask.withdrawalRequests ?? EMPTY_ARRAY;

export const selectPerpsDepositRequests = (state: PerpsState) =>
  state.metamask.depositRequests ?? EMPTY_ARRAY;

export const selectPerpsWithdrawalProgress = (state: PerpsState) =>
  state.metamask.withdrawalProgress ?? null;

export const selectPerpsIsFirstTimeUser = (state: PerpsState) =>
  state.metamask.isFirstTimeUser;

export const selectPerpsHasPlacedFirstOrder = (state: PerpsState) =>
  state.metamask.hasPlacedFirstOrder ?? DEFAULT_HAS_PLACED_FIRST_ORDER;

export const selectPerpsWatchlistMarkets = (state: PerpsState) =>
  state.metamask.watchlistMarkets ?? DEFAULT_WATCHLIST_MARKETS;

/**
 * Whether `symbol` is on the watchlist for the current environment (testnet vs mainnet).
 * @param state
 * @param symbol
 */
export const selectPerpsIsWatchlistMarket = (
  state: PerpsState,
  symbol: string,
): boolean => {
  if (!symbol) {
    return false;
  }
  const { testnet, mainnet } = selectPerpsWatchlistMarkets(state);
  const list = selectPerpsIsTestnet(state) ? testnet : mainnet;
  const upper = symbol.toUpperCase();
  return list.some((s) => s.toUpperCase() === upper);
};

export const selectPerpsLastError = (state: PerpsState) =>
  state.metamask.lastError ?? null;

export const selectPerpsSelectedPaymentToken = (state: PerpsState) =>
  state.metamask.selectedPaymentToken ?? null;

export const selectPerpsCachedMarketData = (state: PerpsState) => {
  const provider = selectPerpsActiveProvider(state);
  return state.metamask.cachedMarketDataByProvider?.[provider]?.data ?? null;
};

export const selectPerpsCachedPositions = (state: PerpsState) => {
  const provider = selectPerpsActiveProvider(state);
  return state.metamask.cachedUserDataByProvider?.[provider]?.positions ?? null;
};

export const selectPerpsCachedOrders = (state: PerpsState) => {
  const provider = selectPerpsActiveProvider(state);
  return state.metamask.cachedUserDataByProvider?.[provider]?.orders ?? null;
};

export const selectPerpsCachedAccountState = (state: PerpsState) => {
  const provider = selectPerpsActiveProvider(state);
  return (
    state.metamask.cachedUserDataByProvider?.[provider]?.accountState ?? null
  );
};

export const selectPerpsPerpsBalances = (state: PerpsState) =>
  state.metamask.perpsBalances ?? {};

export const selectPerpsMarketFilterPreferences = (state: PerpsState) =>
  state.metamask.marketFilterPreferences ?? null;

export const selectPerpsTradeConfigurations = (state: PerpsState) =>
  state.metamask.tradeConfigurations ?? EMPTY_TRADE_CONFIGURATIONS;
