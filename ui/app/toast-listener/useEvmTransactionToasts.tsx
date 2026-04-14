import React, { useEffect, useRef } from 'react';
import type { Json } from '@metamask/utils';
import { useSelector } from 'react-redux';
import {
  isEvmTransactionEligibleForToast,
  selectEvmTransactionsForToast,
  selectEvmToastEligibility,
} from '../../selectors/toast';
import { getEvmTransactionToastId } from '../../helpers/utils/toasts';
import { getStatusKey } from '../../helpers/utils/transactions.util';
import { subscribeToMessengerEvent } from '../../store/background-connection';
import {
  showPendingToast,
  showSuccessToast,
  showFailedToast,
  getTransactionFromEvent,
} from './shared';

const eventNames = [
  'TransactionController:transactionSubmitted',
  'TransactionController:transactionConfirmed',
  'TransactionController:transactionFailed',
  'TransactionController:transactionDropped',
] as const;

type EventName = (typeof eventNames)[number];

export function useEvmTransactionToasts() {
  const toastEligibility = useSelector(selectEvmToastEligibility);
  const toastEligibilityRef = useRef(toastEligibility);

  // Keep eligibility available without resubscribing
  useEffect(() => {
    toastEligibilityRef.current = toastEligibility;
  }, [toastEligibility]);

  // Tracks which transactions already have a pending toast so only those get resolved in the Redux fallback
  const pendingToastsRef = useRef<Set<string>>(new Set());

  // Subscribe to messenger events
  useEffect(() => {
    let isActive = true;
    const unsubscribers: (() => Promise<void>)[] = [];

    const handleEvent = (eventName: EventName) => (args: unknown[]) => {
      const tx = getTransactionFromEvent(args);
      if (!tx?.id) {
        return;
      }

      const isEligible = isEvmTransactionEligibleForToast(
        tx,
        toastEligibilityRef.current,
      );

      if (!isEligible) {
        return;
      }

      const toastId = getEvmTransactionToastId(tx.id);

      switch (eventName) {
        case 'TransactionController:transactionSubmitted':
          pendingToastsRef.current.add(tx.id);
          showPendingToast(toastId);
          break;
        case 'TransactionController:transactionConfirmed':
          if (getStatusKey(tx) === 'failed') {
            showFailedToast(toastId);
          } else {
            showSuccessToast(toastId);
          }
          pendingToastsRef.current.delete(tx.id);
          break;
        case 'TransactionController:transactionFailed':
        case 'TransactionController:transactionDropped':
          showFailedToast(toastId);
          pendingToastsRef.current.delete(tx.id);
          break;
        default:
          break;
      }
    };

    async function setupSubscriptions() {
      for (const eventName of eventNames) {
        try {
          const unsubscribe = await subscribeToMessengerEvent<Json[]>(
            eventName,
            handleEvent(eventName),
          );

          if (!isActive) {
            await unsubscribe();
            continue;
          }

          unsubscribers.push(unsubscribe);
        } catch {
          // Ignore subscription failures
        }
      }
    }

    setupSubscriptions().catch(() => {
      // Ignore subscription failures
    });

    return () => {
      isActive = false;
      unsubscribers.forEach((unsubscribe) => {
        unsubscribe().catch(() => {
          // Ignore unsubscribe failures
        });
      });
    };
  }, []);

  // Edge case: success/fallback handling in case messenger misses a terminal event
  const transactions = useSelector(selectEvmTransactionsForToast);

  // Reconcile pending toasts against Redux so success/failure still lands
  useEffect(() => {
    for (const tx of transactions) {
      if (!tx?.id || !pendingToastsRef.current.has(tx.id)) {
        continue;
      }

      const status = getStatusKey(tx);
      const toastId = getEvmTransactionToastId(tx.id);

      if (status === 'failed') {
        showFailedToast(toastId);
        pendingToastsRef.current.delete(tx.id);
        continue;
      }

      if (status === 'confirmed') {
        showSuccessToast(toastId);
        pendingToastsRef.current.delete(tx.id);
      }
    }
  }, [transactions]);
}
