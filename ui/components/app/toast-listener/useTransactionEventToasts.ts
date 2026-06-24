import { useEffect } from 'react';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import type {
  AccountTransactionsUpdatedEventPayload,
  Transaction,
} from '@metamask/keyring-api';
import { useMessenger } from '../../../hooks/useMessenger';
import { hasTransactionType } from '../../../../shared/lib/transactions.utils';
import type { RouteMessengerFromCapabilities } from '../../../messengers/route-messenger';
import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';
import { showPendingToast, showSuccessToast, showFailedToast } from './shared';
import {
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
  TransactionType.musdConversion,
  TransactionType.musdClaim,
  TransactionType.musdRelayDeposit,
  TransactionType.perpsDeposit,
  TransactionType.perpsDepositAndOrder,
  TransactionType.perpsWithdraw,
  TransactionType.perpsRelayDeposit,
  TransactionType.shieldSubscriptionApprove,
];

function isExcludedTransactionType(transactionMeta: TransactionMeta): boolean {
  return hasTransactionType(transactionMeta, excludedTransactionTypes);
}

const failedStatuses = new Set(['failed', 'dropped', 'rejected', 'cancelled']);

function generateToastId(id: string): string {
  return `tx-${id}`;
}

function extractPayload<Type>(raw: Type | [Type]): Type {
  return Array.isArray(raw) ? raw[0] : raw;
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
    setTimeout(() => showSuccessToast(toastId), 0);
  } else if (tx.status === 'failed' && shouldShowTerminalToast(tx.id)) {
    setTimeout(() => showFailedToast(toastId), 0);
  }
}

/**
 * Subscribes to background transaction lifecycle events via the UI messenger
 */
export function useTransactionEventToasts(): void {
  const messenger = useMessenger<ToastListenerMessenger>();

  useEffect(() => {
    // EVM — single event covers all status transitions
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

      if (status === 'submitted' && shouldShowPendingToast(id)) {
        showPendingToast(toastId);
      } else if (status === 'confirmed' && shouldShowTerminalToast(id)) {
        // Defer so the pending toast has at least one frame to render
        // before transitioning to success on fast transactions
        setTimeout(() => showSuccessToast(toastId), 0);
      } else if (failedStatuses.has(status) && shouldShowTerminalToast(id)) {
        setTimeout(() => showFailedToast(toastId), 0);
      }
    };

    // Non-EVM — pending, success, and failed via AccountsController.
    const handleAccountsTxUpdated = (
      raw:
        | AccountTransactionsUpdatedEventPayload
        | [AccountTransactionsUpdatedEventPayload],
    ) => {
      const payload = extractPayload(raw);
      for (const txs of Object.values(payload?.transactions ?? {})) {
        for (const tx of txs) {
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
  }, [messenger]);
}
