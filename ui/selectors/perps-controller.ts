import type { PerpsControllerState } from '@metamask/perps-controller';

type PerpsState = {
  metamask: {
    PerpsController?: PerpsControllerState;
  };
};

const EMPTY_ARRAY: never[] = [];

export const selectPerpsControllerState = (
  state: PerpsState,
): PerpsControllerState | undefined => state.metamask.PerpsController;

export const selectPerpsIsEligible = (state: PerpsState): boolean =>
  state.metamask.PerpsController?.isEligible ?? false;

export const selectPerpsInitializationState = (state: PerpsState) =>
  state.metamask.PerpsController?.initializationState ?? 'uninitialized';

export const selectPerpsInitializationError = (state: PerpsState) =>
  state.metamask.PerpsController?.initializationError ?? null;

export const selectPerpsIsTestnet = (state: PerpsState): boolean =>
  state.metamask.PerpsController?.isTestnet ?? false;

export const selectPerpsActiveProvider = (state: PerpsState) =>
  state.metamask.PerpsController?.activeProvider ?? 'hyperliquid';

export const selectPerpsDepositInProgress = (state: PerpsState): boolean =>
  state.metamask.PerpsController?.depositInProgress ?? false;

export const selectPerpsLastDepositTransactionId = (state: PerpsState) =>
  state.metamask.PerpsController?.lastDepositTransactionId ?? null;

export const selectPerpsLastDepositResult = (state: PerpsState) =>
  state.metamask.PerpsController?.lastDepositResult ?? null;

export const selectPerpsWithdrawInProgress = (state: PerpsState): boolean =>
  state.metamask.PerpsController?.withdrawInProgress ?? false;

export const selectPerpsLastWithdrawResult = (state: PerpsState) =>
  state.metamask.PerpsController?.lastWithdrawResult ?? null;

export const selectPerpsWithdrawalRequests = (state: PerpsState) =>
  state.metamask.PerpsController?.withdrawalRequests ?? EMPTY_ARRAY;

export const selectPerpsDepositRequests = (state: PerpsState) =>
  state.metamask.PerpsController?.depositRequests ?? EMPTY_ARRAY;

export const selectPerpsWithdrawalProgress = (state: PerpsState) =>
  state.metamask.PerpsController?.withdrawalProgress ?? null;

export const selectPerpsIsFirstTimeUser = (state: PerpsState) =>
  state.metamask.PerpsController?.isFirstTimeUser ?? {
    testnet: true,
    mainnet: true,
  };

export const selectPerpsHasPlacedFirstOrder = (state: PerpsState) =>
  state.metamask.PerpsController?.hasPlacedFirstOrder ?? {
    testnet: false,
    mainnet: false,
  };

export const selectPerpsWatchlistMarkets = (state: PerpsState) =>
  state.metamask.PerpsController?.watchlistMarkets ?? {
    testnet: EMPTY_ARRAY,
    mainnet: EMPTY_ARRAY,
  };

export const selectPerpsLastError = (state: PerpsState) =>
  state.metamask.PerpsController?.lastError ?? null;

export const selectPerpsSelectedPaymentToken = (state: PerpsState) =>
  state.metamask.PerpsController?.selectedPaymentToken ?? null;

export const selectPerpsCachedMarketData = (state: PerpsState) =>
  state.metamask.PerpsController?.cachedMarketData ?? null;

export const selectPerpsCachedPositions = (state: PerpsState) =>
  state.metamask.PerpsController?.cachedPositions ?? null;

export const selectPerpsCachedOrders = (state: PerpsState) =>
  state.metamask.PerpsController?.cachedOrders ?? null;

export const selectPerpsCachedAccountState = (state: PerpsState) =>
  state.metamask.PerpsController?.cachedAccountState ?? null;

export const selectPerpsPerpsBalances = (state: PerpsState) =>
  state.metamask.PerpsController?.perpsBalances ?? {};

export const selectPerpsMarketFilterPreferences = (state: PerpsState) =>
  state.metamask.PerpsController?.marketFilterPreferences ?? null;
