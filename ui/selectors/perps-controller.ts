import { createSelector } from 'reselect';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type { PerpsControllerState } from '@metamask/perps-controller';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import type { Hex } from '@metamask/utils';

/**
 * The PerpsController state is flattened into state.metamask by
 * ComposableObservableStore.getFlatState(). All properties live directly
 * on state.metamask, NOT nested under state.metamask.PerpsController.
 */
export type PerpsState = {
  metamask: Partial<PerpsControllerState>;
};

/**
 * Transaction statuses that represent the "deposit is pending" window on the
 * extension. We start showing the pending toast once the user has confirmed
 * the transaction (it reaches `approved`) and keep it up through `signed` and
 * `submitted` until `lastDepositResult` populates and the completion branch
 * takes over. `unapproved` (confirmation screen open) and `rejected` (user
 * cancel) are intentionally excluded so we don't toast before confirm or on
 * cancel, matching mobile's behavior in `usePerpsDepositStatus`.
 */
const PERPS_DEPOSIT_PENDING_STATUSES: ReadonlySet<TransactionStatus> = new Set([
  TransactionStatus.approved,
  TransactionStatus.signed,
  TransactionStatus.submitted,
]);

const PERPS_DEPOSIT_TRANSACTION_TYPES: ReadonlySet<TransactionType> = new Set([
  TransactionType.perpsDeposit,
  TransactionType.perpsDepositAndOrder,
]);

const EMPTY_ARRAY: never[] = [];
const EMPTY_TRANSACTION_DATA: Record<
  string,
  { paymentToken?: { address: Hex; chainId: Hex } }
> = {};
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

/**
 * State shape consumed by `selectPerpsDepositPending`. Kept narrow so tests
 * can supply a partial `metamask` slice without satisfying the full
 * `TransactionControllerState` contract.
 */
type PerpsDepositPendingState = {
  metamask: {
    transactions?: TransactionMeta[];
    lastDepositTransactionId?: string | null;
    transactionData?: Record<
      string,
      {
        paymentToken?: {
          address: Hex;
          chainId: Hex;
        };
      }
    >;
  };
};

const isNativePayToken = (
  paymentToken?:
    | {
        address: Hex;
        chainId: Hex;
      }
    | undefined,
) => {
  if (!paymentToken) {
    return true;
  }

  return (
    paymentToken.address.toLowerCase() ===
    getNativeTokenAddress(paymentToken.chainId).toLowerCase()
  );
};

const isPerpsToastOwnedDepositTransaction = (
  transaction?: TransactionMeta,
  paymentToken?:
    | {
        address: Hex;
        chainId: Hex;
      }
    | undefined,
) => {
  if (!transaction?.type) {
    return false;
  }

  return (
    PERPS_DEPOSIT_TRANSACTION_TYPES.has(transaction.type) &&
    isNativePayToken(paymentToken)
  );
};

const selectPerpsActiveDepositTransaction = createSelector(
  (state: PerpsDepositPendingState): TransactionMeta[] =>
    state.metamask.transactions ?? EMPTY_ARRAY,
  (state: PerpsDepositPendingState) =>
    state.metamask.lastDepositTransactionId ?? null,
  (transactions, lastDepositTransactionId) => {
    if (!lastDepositTransactionId) {
      return null;
    }

    return (
      transactions.find((tx) => tx.id === lastDepositTransactionId) ?? null
    );
  },
);

export const selectPerpsShouldShowDepositToast = createSelector(
  selectPerpsActiveDepositTransaction,
  (state: PerpsDepositPendingState) =>
    state.metamask.transactionData ?? EMPTY_TRANSACTION_DATA,
  (transaction, transactionData) =>
    isPerpsToastOwnedDepositTransaction(
      transaction ?? undefined,
      transaction ? transactionData[transaction.id]?.paymentToken : undefined,
    ),
);

/**
 * Whether the **active** Perps deposit (identified by `lastDepositTransactionId`)
 * is in its pending window (post-confirm, pre-completion). Scoped to that id so
 * unrelated perps deposit rows left in `approved` / `signed` / `submitted` do
 * not keep the deposit toast alive — aligned with `PerpsDepositToast` dismissal
 * keyed on `lastDepositTransactionId`.
 *
 * Derived from TransactionController + PerpsController flattened state rather
 * than `depositInProgress`, which the perps controller only sets briefly
 * alongside the success result.
 *
 * @param state - Combined Perps + TransactionController state.
 */
export const selectPerpsDepositPending = createSelector(
  selectPerpsActiveDepositTransaction,
  (state: PerpsDepositPendingState) =>
    state.metamask.transactionData ?? EMPTY_TRANSACTION_DATA,
  (tx, transactionData) => {
    if (
      !isPerpsToastOwnedDepositTransaction(
        tx ?? undefined,
        tx ? transactionData[tx.id]?.paymentToken : undefined,
      )
    ) {
      return false;
    }

    return tx ? PERPS_DEPOSIT_PENDING_STATUSES.has(tx.status) : false;
  },
);

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
