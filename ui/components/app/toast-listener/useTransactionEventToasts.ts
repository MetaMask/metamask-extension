import { useEffect } from 'react';
import { useStore } from 'react-redux';
import {
  TransactionStatus,
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type {
  AccountTransactionsUpdatedEventPayload,
  Transaction,
} from '@metamask/keyring-api';
import { useMessenger } from '../../../hooks/useMessenger';
import { hasTransactionType } from '../../../../shared/lib/transactions.utils';
import {
  isMoneyAccountChildTx,
  isMoneyAccountTx,
} from '../../../helpers/money/money-transaction-guards';
import { isKnownMoneyBatchChild } from '../../../helpers/money/money-batch-registry';
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

// Separate batch txs that share one toast with the main send/swap/bridge tx.
export const batchHelperTransactionTypes = [
  TransactionType.bridgeApproval,
  TransactionType.swapApproval,
  TransactionType.gasPayment,
];

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

const pendingStatuses = new Set<string>([
  TransactionStatus.approved,
  TransactionStatus.signed,
  TransactionStatus.submitted,
]);

const generateToastId = (id: string) => `tx-${id}`;
const extractPayload = <Type>(raw: Type | [Type]) =>
  Array.isArray(raw) ? raw[0] : raw;

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

/**
 * Subscribes to background transaction lifecycle events via the UI messenger
 */
export function useTransactionEventToasts(): void {
  const messenger = useMessenger<ToastListenerMessenger>();
  const store = useStore<MetaMaskReduxState>();

  useEffect(() => {
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

      const { id, status } = transactionMeta;
      if (!id || !status) {
        return;
      }

      const transactions = selectTransactions(store.getState());
      if (
        isKnownMoneyBatchChild(id) ||
        isExcludedTransactionType(transactionMeta, transactions)
      ) {
        return;
      }

      const toastId = generateToastId(id);
      const props = { transactionId: id };

      if (pendingStatuses.has(status)) {
        if (shouldShowPendingToast(id)) {
          showPendingToast(toastId, props);
        }
      } else if (status === 'confirmed' && shouldShowTerminalToast(id)) {
        showSuccessToast(toastId, props);
      } else if (failedStatuses.has(status)) {
        if (transactionMeta.replacedById) {
          if (
            isSpeedUpReplacement(transactionMeta.replacedById, transactions)
          ) {
            dismissToast(toastId);
            clearToastPhase(id);
          } else if (shouldShowTerminalToast(id)) {
            showFailedToast(toastId, props);
          }
        } else if (shouldShowTerminalToast(id)) {
          showFailedToast(toastId, props);
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
