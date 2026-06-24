import { useEffect } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Transaction } from '@metamask/keyring-api';
import { useMessenger } from '../../../hooks/useMessenger';
import { isPerpsWithdrawTransaction } from '../../../../shared/lib/transactions.utils';
import type { RouteMessengerFromCapabilities } from '../../../messengers/route-messenger';
import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';
import { showPendingToast, showSuccessToast, showFailedToast } from './shared';

export const toastListenerCapabilities = defineAllowedRouteCapabilities({
  actions: [],
  events: [
    'TransactionController:transactionStatusUpdated',
    'MultichainTransactionsController:transactionSubmitted',
    'MultichainTransactionsController:transactionConfirmed',
  ],
});

type ToastListenerMessenger = RouteMessengerFromCapabilities<
  typeof toastListenerCapabilities
>;

// Transactions handled by their own custom code
const excludedToastChecks: ((tx: TransactionMeta) => boolean)[] = [
  isPerpsWithdrawTransaction,
];

const FAILED_STATUSES = new Set(['failed', 'dropped', 'rejected', 'cancelled']);

function generateToastId(id: string): string {
  return `tx-${id}`;
}

function extractPayload<T>(raw: T | [T]): T {
  return Array.isArray(raw) ? raw[0] : raw;
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

      if (excludedToastChecks.some((check) => check(transactionMeta))) {
        return;
      }

      const toastId = generateToastId(id);

      if (status === 'submitted') {
        showPendingToast(toastId);
      } else if (status === 'confirmed') {
        // Defer so the pending toast has at least one frame to render
        // before transitioning to success on fast transactions
        setTimeout(() => showSuccessToast(toastId), 0);
      } else if (FAILED_STATUSES.has(status)) {
        setTimeout(() => showFailedToast(toastId), 0);
      }
    };

    // Non-EVM — submitted events
    const handleNonEvmSubmitted = (raw: Transaction | [Transaction]) => {
      const transaction = extractPayload(raw);
      if (!transaction?.id) {
        return;
      }
      showPendingToast(generateToastId(transaction.id));
    };

    // Non-EVM — confirmed events
    const handleNonEvmConfirmed = (raw: Transaction | [Transaction]) => {
      const transaction = extractPayload(raw);
      if (!transaction?.id) {
        return;
      }
      setTimeout(() => showSuccessToast(generateToastId(transaction.id)), 0);
    };

    messenger.subscribe(
      'TransactionController:transactionStatusUpdated',
      handleEvmStatusUpdate,
    );
    messenger.subscribe(
      'MultichainTransactionsController:transactionSubmitted',
      handleNonEvmSubmitted,
    );
    messenger.subscribe(
      'MultichainTransactionsController:transactionConfirmed',
      handleNonEvmConfirmed,
    );

    return () => {
      messenger.unsubscribe(
        'TransactionController:transactionStatusUpdated',
        handleEvmStatusUpdate,
      );
      messenger.unsubscribe(
        'MultichainTransactionsController:transactionSubmitted',
        handleNonEvmSubmitted,
      );
      messenger.unsubscribe(
        'MultichainTransactionsController:transactionConfirmed',
        handleNonEvmConfirmed,
      );
    };
  }, [messenger]);
}
