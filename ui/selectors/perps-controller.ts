import type { PerpsControllerState } from '@metamask/perps-controller';

/**
 * The PerpsController state is flattened into state.metamask by
 * ComposableObservableStore.getFlatState(). All properties live directly
 * on state.metamask, NOT nested under state.metamask.PerpsController.
 */
type PerpsState = {
  metamask: Partial<PerpsControllerState>;
};

const EMPTY_ARRAY: never[] = [];

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
  state.metamask.isFirstTimeUser ?? {
    testnet: true,
    mainnet: true,
  };

export const selectPerpsHasPlacedFirstOrder = (state: PerpsState) =>
  state.metamask.hasPlacedFirstOrder ?? {
    testnet: false,
    mainnet: false,
  };

export const selectPerpsWatchlistMarkets = (state: PerpsState) =>
  state.metamask.watchlistMarkets ?? {
    testnet: EMPTY_ARRAY,
    mainnet: EMPTY_ARRAY,
  };

export const selectPerpsLastError = (state: PerpsState) =>
  state.metamask.lastError ?? null;

export const selectPerpsSelectedPaymentToken = (state: PerpsState) =>
  state.metamask.selectedPaymentToken ?? null;

export const selectPerpsCachedMarketData = (state: PerpsState) =>
  state.metamask.cachedMarketData ?? null;

export const selectPerpsCachedPositions = (state: PerpsState) =>
  state.metamask.cachedPositions ?? null;

export const selectPerpsCachedOrders = (state: PerpsState) =>
  state.metamask.cachedOrders ?? null;

export const selectPerpsCachedAccountState = (state: PerpsState) =>
  state.metamask.cachedAccountState ?? null;

export const selectPerpsPerpsBalances = (state: PerpsState) =>
  state.metamask.perpsBalances ?? {};

export const selectPerpsMarketFilterPreferences = (state: PerpsState) =>
  state.metamask.marketFilterPreferences ?? null;
