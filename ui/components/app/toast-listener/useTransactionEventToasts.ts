import { useEffect } from 'react';
import { useStore } from 'react-redux';
import type { Store } from 'redux';
import type { Hex } from 'viem';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type {
  AccountTransactionsUpdatedEventPayload,
  Transaction,
} from '@metamask/keyring-api';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import { TX_DETAILS_ROUTE } from '#ui/helpers/constants/routes';
import { useMessenger } from '../../../hooks/useMessenger';
import {
  hasTransactionType,
  isPerpsWithdrawTransaction,
} from '../../../../shared/lib/transactions.utils';
import {
  isMoneyAccountChildTx,
  isMoneyAccountTx,
} from '../../../helpers/money/money-transaction-guards';
import {
  isKnownMoneyBatchChild,
  isMoneyBatchInFlight,
} from '../../../helpers/money/money-batch-registry';
import type { RouteMessengerFromCapabilities } from '../../../messengers/route-messenger';
import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';
import type { MetaMaskReduxState } from '../../../store/store';
import { selectTransactions } from '../../../selectors/transactionController';
import {
  dismissToast,
  showPendingToast,
  showSuccessToast,
  showFailedToast,
} from './shared';
import {
  clearToastPhase,
  shouldShowPendingToast,
  shouldShowTerminalToast,
} from './toast-lifecycle';

export const toastListenerCapabilities = defineAllowedRouteCapabilities({
  actions: [],
  events: [
    'TransactionController:transactionStatusUpdated',
    'AccountsController:accountTransactionsUpdated',
  ],
});

type ToastListenerMessenger = RouteMessengerFromCapabilities<
  typeof toastListenerCapabilities
>;

// Flows with custom toasts — excluded for now from generic messenger event toasts.
const excludedTransactionTypes: TransactionType[] = [
  TransactionType.musdRelayDeposit,
  TransactionType.perpsDeposit,
  TransactionType.perpsDepositAndOrder,
  TransactionType.perpsRelayDeposit,
  TransactionType.shieldSubscriptionApprove,
];

// Ported from custom toasts that included pre-broadcast (approved/signed) stage
const earlyPendingToastTypes = new Set([
  TransactionType.musdConversion,
  TransactionType.musdClaim,
]);

// Separate batch txs that share one toast with the main send/swap/bridge tx.
export const batchHelperTransactionTypes = [
  TransactionType.bridgeApproval,
  TransactionType.swapApproval,
  TransactionType.gasPayment,
];

/**
 * Upper bound for waiting on the debounced Redux sync while a money batch is
 * in flight. Matches `sendUpdate`'s maxWait (1s) with headroom so a registry
 * leak can never permanently swallow a legitimate toast.
 */
const MONEY_BATCH_PENDING_TOAST_DEFER_MS = 3000;

function isExcludedTransactionType(
  transactionMeta: TransactionMeta,
  transactions: TransactionMeta[],
): boolean {
  if (
    transactionMeta.type &&
    batchHelperTransactionTypes.includes(transactionMeta.type)
  ) {
    return true;
  }
  return (
    hasTransactionType(transactionMeta, excludedTransactionTypes) ||
    isMoneyAccountTx(transactionMeta) ||
    isMoneyAccountChildTx(transactionMeta, transactions)
  );
}

const failedStatuses = new Set(['failed', 'dropped', 'rejected', 'cancelled']);

function isPendingToastStatus(
  transactionMeta: TransactionMeta,
  status: string,
) {
  if (status === TransactionStatus.submitted) {
    return true;
  }

  const isEarlyPending =
    (transactionMeta.type &&
      earlyPendingToastTypes.has(transactionMeta.type)) ||
    isPerpsWithdrawTransaction(transactionMeta);

  if (isEarlyPending) {
    return (
      status === TransactionStatus.approved ||
      status === TransactionStatus.signed
    );
  }

  return false;
}

const generateToastId = (id: string) => `tx-${id}`;
const extractPayload = <Type>(raw: Type | [Type]) =>
  Array.isArray(raw) ? raw[0] : raw;

function getDetailsRoute(chainId?: Hex, hash?: string) {
  if (!chainId || !hash) {
    return undefined;
  }

  return `${TX_DETAILS_ROUTE}/${toEvmCaipChainId(chainId)}/${hash}`;
}

function isSpeedUpReplacement(
  replacedById: string,
  transactions: TransactionMeta[],
) {
  const replacement = transactions.find((tx) => tx.id === replacedById);

  if (replacement?.type === TransactionType.cancel) {
    return false;
  }

  // Retry replacement, or replacement not in Redux yet
  return true;
}

function handleAccountsControllerTx(tx: Transaction) {
  if (!tx?.id || !tx?.status) {
    return;
  }

  if (tx.chain?.startsWith('eip155:')) {
    return;
  }

  const toastId = generateToastId(tx.id);

  if (tx.status === 'unconfirmed' && shouldShowPendingToast(tx.id)) {
    showPendingToast(toastId);
  } else if (tx.status === 'confirmed' && shouldShowTerminalToast(tx.id)) {
    showSuccessToast(toastId);
  } else if (tx.status === 'failed' && shouldShowTerminalToast(tx.id)) {
    showFailedToast(toastId);
  }
}

type PendingDeferral = {
  cancel: () => void;
};

/**
 * While a money batch is in flight, the Redux snapshot used by
 * `isMoneyAccountChildTx` can lag the messenger event (debounced sendUpdate).
 * Defer the pending-toast decision until either Redux shows the parent link,
 * or the timeout fires and we show the toast as a safe fallback.
 *
 * @param id - Transaction id whose pending toast is deferred.
 * @param transactionMeta - Fresh event payload for exclusion checks.
 * @param store - Redux store to subscribe to for catch-up.
 * @param pendingDeferrals - Active deferrals map for cancellation.
 * @param show - Callback that shows the pending toast (phase-gated).
 */
function deferPendingToastDecision(
  id: string,
  transactionMeta: TransactionMeta,
  store: Store<MetaMaskReduxState>,
  pendingDeferrals: Map<string, PendingDeferral>,
  show: () => void,
): void {
  pendingDeferrals.get(id)?.cancel();

  let settled = false;
  let unsubscribe: () => void = () => undefined;
  const timeout = {
    id: undefined as ReturnType<typeof setTimeout> | undefined,
  };

  const finish = (shouldShow: boolean) => {
    if (settled) {
      return;
    }
    settled = true;
    unsubscribe();
    if (timeout.id !== undefined) {
      clearTimeout(timeout.id);
    }
    pendingDeferrals.delete(id);
    if (shouldShow) {
      show();
    }
  };

  const recheck = () => {
    const transactions = selectTransactions(store.getState());
    if (
      isExcludedTransactionType(transactionMeta, transactions) ||
      isKnownMoneyBatchChild(id)
    ) {
      finish(false);
    }
  };

  unsubscribe = store.subscribe(recheck);
  timeout.id = setTimeout(
    () => finish(true),
    MONEY_BATCH_PENDING_TOAST_DEFER_MS,
  );

  pendingDeferrals.set(id, {
    cancel: () => finish(false),
  });

  // State may already have caught up between the event and this deferral.
  recheck();
}

/**
 * Subscribes to background transaction lifecycle events via the UI messenger
 */
export function useTransactionEventToasts(): void {
  const messenger = useMessenger<ToastListenerMessenger>();
  const store = useStore<MetaMaskReduxState>();

  useEffect(() => {
    const pendingDeferrals = new Map<string, PendingDeferral>();

    // EVM via TransactionController
    const handleEvmStatusUpdate = (
      raw:
        | { transactionMeta: TransactionMeta }
        | [{ transactionMeta: TransactionMeta }],
    ) => {
      const { transactionMeta } = extractPayload(raw);
      if (!transactionMeta) {
        return;
      }

      const { id, status, hash, chainId } = transactionMeta;
      if (!id || !status) {
        return;
      }

      if (isKnownMoneyBatchChild(id)) {
        pendingDeferrals.get(id)?.cancel();
        return;
      }

      const transactions = selectTransactions(store.getState());
      if (isExcludedTransactionType(transactionMeta, transactions)) {
        pendingDeferrals.get(id)?.cancel();
        return;
      }

      const toastId = generateToastId(id);
      const props = {
        transactionId: id,
        to: getDetailsRoute(chainId, hash),
      };

      if (isPendingToastStatus(transactionMeta, status)) {
        const show = () => {
          if (shouldShowPendingToast(id)) {
            showPendingToast(toastId, props);
          }
        };

        // Money Pay children often submit before Redux carries the parent's
        // `requiredTransactionIds`. Defer so the guard can re-run against a
        // caught-up snapshot; unrelated txs only wait while a money batch is
        // in flight, then show after timeout.
        if (isMoneyBatchInFlight()) {
          deferPendingToastDecision(
            id,
            transactionMeta,
            store,
            pendingDeferrals,
            show,
          );
          return;
        }

        show();
      } else if (status === 'confirmed') {
        pendingDeferrals.get(id)?.cancel();

        if (
          isExcludedTransactionType(
            transactionMeta,
            selectTransactions(store.getState()),
          ) ||
          isKnownMoneyBatchChild(id)
        ) {
          return;
        }

        if (shouldShowTerminalToast(id)) {
          showSuccessToast(toastId, props);
          return;
        }

        // Pending was deferred and cancelled before a phase was reserved —
        // wait for Redux catch-up (or timeout) before showing terminal.
        if (isMoneyBatchInFlight()) {
          deferPendingToastDecision(
            id,
            transactionMeta,
            store,
            pendingDeferrals,
            () => {
              const latestTransactions = selectTransactions(store.getState());
              if (
                isExcludedTransactionType(
                  transactionMeta,
                  latestTransactions,
                ) ||
                isKnownMoneyBatchChild(id)
              ) {
                return;
              }
              shouldShowPendingToast(id);
              if (shouldShowTerminalToast(id)) {
                showSuccessToast(toastId, props);
              }
            },
          );
        }
      } else if (failedStatuses.has(status)) {
        pendingDeferrals.get(id)?.cancel();

        const latestTransactions = selectTransactions(store.getState());
        if (
          isExcludedTransactionType(transactionMeta, latestTransactions) ||
          isKnownMoneyBatchChild(id)
        ) {
          return;
        }

        if (transactionMeta.replacedById) {
          if (
            isSpeedUpReplacement(
              transactionMeta.replacedById,
              latestTransactions,
            )
          ) {
            dismissToast(toastId);
            clearToastPhase(id);
            return;
          }
        }

        if (shouldShowTerminalToast(id)) {
          showFailedToast(toastId, props);
          return;
        }

        // Pending was deferred and cancelled before a phase was reserved.
        if (isMoneyBatchInFlight()) {
          deferPendingToastDecision(
            id,
            transactionMeta,
            store,
            pendingDeferrals,
            () => {
              const txs = selectTransactions(store.getState());
              if (
                isExcludedTransactionType(transactionMeta, txs) ||
                isKnownMoneyBatchChild(id)
              ) {
                return;
              }
              if (
                transactionMeta.replacedById &&
                isSpeedUpReplacement(transactionMeta.replacedById, txs)
              ) {
                dismissToast(toastId);
                clearToastPhase(id);
                return;
              }
              shouldShowPendingToast(id);
              if (shouldShowTerminalToast(id)) {
                showFailedToast(toastId, props);
              }
            },
          );
        }
      }
    };

    // Non-EVM via AccountsController
    const handleAccountsTxUpdated = (
      raw:
        | AccountTransactionsUpdatedEventPayload
        | [AccountTransactionsUpdatedEventPayload],
    ) => {
      const payload = extractPayload(raw);
      for (const accountTxs of Object.values(payload?.transactions ?? {})) {
        for (const tx of accountTxs) {
          handleAccountsControllerTx(tx);
        }
      }
    };

    messenger.subscribe(
      'TransactionController:transactionStatusUpdated',
      handleEvmStatusUpdate,
    );
    messenger.subscribe(
      'AccountsController:accountTransactionsUpdated',
      handleAccountsTxUpdated,
    );

    return () => {
      for (const deferral of pendingDeferrals.values()) {
        deferral.cancel();
      }
      pendingDeferrals.clear();
      messenger.unsubscribe(
        'TransactionController:transactionStatusUpdated',
        handleEvmStatusUpdate,
      );
      messenger.unsubscribe(
        'AccountsController:accountTransactionsUpdated',
        handleAccountsTxUpdated,
      );
    };
  }, [messenger, store]);
}
