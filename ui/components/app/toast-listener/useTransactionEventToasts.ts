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
import {
  hasTransactionType,
  isPerpsWithdrawTransaction,
} from '../../../../shared/lib/transactions.utils';
import type { RouteMessengerFromCapabilities } from '../../../messengers/route-messenger';
import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';
import type { MetaMaskReduxState } from '../../../store/store';
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

function isExcludedTransactionType(transactionMeta: TransactionMeta): boolean {
  // Top-level only — nested swapApproval inside batch txs must still toast.
  if (
    transactionMeta.type === TransactionType.bridgeApproval ||
    transactionMeta.type === TransactionType.swapApproval
  ) {
    return true;
  }
  return hasTransactionType(transactionMeta, excludedTransactionTypes);
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

      if (isExcludedTransactionType(transactionMeta)) {
        return;
      }

      const toastId = generateToastId(id);
      const props = { transactionId: id };

      if (isPendingToastStatus(transactionMeta, status)) {
        if (shouldShowPendingToast(id)) {
          showPendingToast(toastId, props);
        }
      } else if (status === 'confirmed' && shouldShowTerminalToast(id)) {
        showSuccessToast(toastId, props);
      } else if (failedStatuses.has(status)) {
        if (transactionMeta.replacedById) {
          const transactions = store.getState().metamask?.transactions ?? [];
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
