import { useEffect } from 'react';
import type { Json } from '@metamask/utils';
import type { Transaction } from '@metamask/keyring-api';
import { useMessenger } from '../../../hooks/useMessenger';
import { showPendingToast, showSuccessToast, showFailedToast } from './shared';
import type { ToastListenerMessenger } from './messenger';

const FAILED_STATUSES = new Set(['failed', 'dropped', 'rejected', 'cancelled']);

// Module-level so the pending set survives component remounts during re-render cycles.
const pendingToastIds = new Set<string>();

function generateToastId(id: string): string {
  return `tx-${id}`;
}

/**
 * Subscribes to background transaction lifecycle events via the UI messenger
 * and shows toasts imperatively for EVM and non-EVM transactions.
 *
 * No Redux reads. No state diffing. No dispatch calls.
 * Subscriptions are automatically torn down when the component unmounts.
 */
export function useTransactionEventToasts(): void {
  const messenger = useMessenger<ToastListenerMessenger>();

  useEffect(() => {
    // EVM — single event covers all status transitions.
    // The payload arrives wrapped in an array because MessengerSubscriptions
    // captures rest-args before UIMessenger re-spreads into the route messenger.
    const handleEvmStatusUpdate = (rawPayload: unknown) => {
      const payload = Array.isArray(rawPayload) ? rawPayload[0] : rawPayload;
      const transactionMeta = (payload as Record<string, unknown>)
        ?.transactionMeta as Record<string, Json> | undefined;

      const id = transactionMeta?.id as string | undefined;
      const status = transactionMeta?.status as string | undefined;
      if (!id || !status) {
        return;
      }

      const toastId = generateToastId(id);
      console.log('>>> [useTransactionEventToasts] EVM status:', status, toastId);

      if (status === 'submitted' && !pendingToastIds.has(toastId)) {
        pendingToastIds.add(toastId);
        showPendingToast(toastId);
        return;
      }

      if (!pendingToastIds.has(toastId)) {
        return;
      }

      if (status === 'confirmed') {
        // Defer to the next tick so the pending toast renders before transitioning.
        setTimeout(() => {
          showSuccessToast(toastId);
          pendingToastIds.delete(toastId);
        }, 0);
        return;
      }

      if (FAILED_STATUSES.has(status)) {
        setTimeout(() => {
          showFailedToast(toastId);
          pendingToastIds.delete(toastId);
        }, 0);
      }
    };

    // Non-EVM — separate submitted / confirmed events.
    const handleNonEvmSubmitted = (rawPayload: unknown) => {
      const transaction = (
        Array.isArray(rawPayload) ? rawPayload[0] : rawPayload
      ) as Transaction;
      const toastId = generateToastId(transaction.id);
      console.log('>>> [useTransactionEventToasts] non-EVM submitted:', toastId);
      if (!pendingToastIds.has(toastId)) {
        pendingToastIds.add(toastId);
        showPendingToast(toastId);
      }
    };

    const handleNonEvmConfirmed = (rawPayload: unknown) => {
      const transaction = (
        Array.isArray(rawPayload) ? rawPayload[0] : rawPayload
      ) as Transaction;
      const toastId = generateToastId(transaction.id);
      console.log('>>> [useTransactionEventToasts] non-EVM confirmed:', toastId);
      if (pendingToastIds.has(toastId)) {
        setTimeout(() => {
          showSuccessToast(toastId);
          pendingToastIds.delete(toastId);
        }, 0);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscribe = (event: string, handler: (payload: unknown) => void) =>
      messenger.subscribe(event as any, handler as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = (event: string, handler: (payload: unknown) => void) =>
      messenger.unsubscribe(event as any, handler as any);

    subscribe(
      'TransactionController:transactionStatusUpdated',
      handleEvmStatusUpdate,
    );
    subscribe(
      'MultichainTransactionsController:transactionSubmitted',
      handleNonEvmSubmitted,
    );
    subscribe(
      'MultichainTransactionsController:transactionConfirmed',
      handleNonEvmConfirmed,
    );

    return () => {
      unsubscribe(
        'TransactionController:transactionStatusUpdated',
        handleEvmStatusUpdate,
      );
      unsubscribe(
        'MultichainTransactionsController:transactionSubmitted',
        handleNonEvmSubmitted,
      );
      unsubscribe(
        'MultichainTransactionsController:transactionConfirmed',
        handleNonEvmConfirmed,
      );
    };
  }, [messenger]);
}
