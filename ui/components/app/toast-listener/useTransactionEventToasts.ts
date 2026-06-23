import { useEffect } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { Transaction } from '@metamask/keyring-api';
import { useMessenger } from '../../../hooks/useMessenger';
import { showPendingToast, showSuccessToast, showFailedToast } from './shared';
import type { ToastListenerMessenger } from './messenger';

const FAILED_STATUSES = new Set(['failed', 'dropped', 'rejected', 'cancelled']);

function generateToastId(id: string): string {
  return `tx-${id}`;
}

function extractPayload<T>(raw: T | [T]): T {
  return Array.isArray(raw) ? raw[0] : raw;
}

/**
 * Subscribes to background transaction lifecycle events via the UI messenger
 * and shows toasts imperatively for EVM and non-EVM transactions.
 */
export function useTransactionEventToasts(): void {
  const messenger = useMessenger<ToastListenerMessenger>();

  useEffect(() => {
    // EVM — single event covers all status transitions.
    const handleEvmStatusUpdate = (raw: {
      transactionMeta: TransactionMeta;
    }) => {
      const { transactionMeta } = extractPayload(raw);
      if (!transactionMeta) {
        return;
      }

      const { id, status } = transactionMeta;
      if (!id || !status) {
        return;
      }

      const toastId = generateToastId(id);

      if (status === 'submitted') {
        showPendingToast(toastId);
      } else if (status === 'confirmed') {
        // Defer so the pending toast has at least one frame to render
        // before transitioning to success on fast transactions.
        setTimeout(() => showSuccessToast(toastId), 0);
      } else if (FAILED_STATUSES.has(status)) {
        setTimeout(() => showFailedToast(toastId), 0);
      }
    };

    // Non-EVM — submitted events.
    const handleNonEvmSubmitted = (raw: Transaction) => {
      const transaction = extractPayload(raw);
      if (!transaction?.id) {
        return;
      }
      showPendingToast(generateToastId(transaction.id));
    };

    // Non-EVM — confirmed events.
    // react-hot-toast is idempotent on the same ID, so duplicate confirmed
    // events for the same tx just update the same toast.
    const handleNonEvmConfirmed = (raw: Transaction) => {
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
