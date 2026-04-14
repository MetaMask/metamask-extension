import React, { useEffect, useRef } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
  type EvmToastEligibilityCriteria,
  isEvmTransactionEligibleForToast,
  selectEvmTransactionsForToast,
  selectEvmToastEligibilityCriteria,
} from '../../selectors/toast';
import {
  useTransactionDisplay,
  type TransactionStatus,
} from '../../helpers/utils/transaction-display';
import { getEvmTransactionToastId } from '../../helpers/utils/getTransactionToastId';
import { ToastContent as ToastContentBase } from '../../components/ui/toast/toast';
import { getStatusKey } from '../../helpers/utils/transactions.util';
import { subscribeToMessengerEvent } from '../../store/background-connection';

const EVENT_NAMES = [
  'TransactionController:transactionSubmitted',
  'TransactionController:transactionConfirmed',
  'TransactionController:transactionFailed',
  'TransactionController:transactionDropped',
] as const;

type EventName = (typeof EVENT_NAMES)[number];

type EventPayloadArg = TransactionMeta | { transactionMeta?: TransactionMeta };
type Unsubscribe = () => Promise<void>;

const ToastContent = ({ status }: { status: TransactionStatus }) => {
  const { title } = useTransactionDisplay(status);
  return <ToastContentBase title={title} />;
};

function getTransactionMetaFromEventArgs(args: unknown[]): TransactionMeta | null {
  const firstArg = args?.[0] as EventPayloadArg | undefined;
  if (!firstArg || typeof firstArg !== 'object') {
    return null;
  }

  if ('transactionMeta' in firstArg) {
    return firstArg.transactionMeta ?? null;
  }

  return firstArg as TransactionMeta;
}

export function useEvmTransactionMessengerToasts() {
  const evmTransactions = useSelector(selectEvmTransactionsForToast);
  const evmToastEligibilityCriteria = useSelector(
    selectEvmToastEligibilityCriteria,
  );

  // Stable messenger callbacks read the latest eligibility inputs from this ref.
  const latestEligibilityCriteriaRef = useRef<EvmToastEligibilityCriteria>(
    evmToastEligibilityCriteria,
  );
  // Tracks which txs already have a pending toast so only those get later resolved.
  const inFlightToastIdsRef = useRef<Set<string>>(new Set());

  // Keep the latest eligibility inputs available without resubscribing to messenger events.
  useEffect(() => {
    latestEligibilityCriteriaRef.current = evmToastEligibilityCriteria;
  }, [evmToastEligibilityCriteria]);

  // Reconcile pending toasts against Redux so success/failure still lands if messenger misses a terminal event.
  useEffect(() => {
    for (const txMeta of evmTransactions) {
      if (!txMeta?.id || !inFlightToastIdsRef.current.has(txMeta.id)) {
        continue;
      }

      const statusKey = getStatusKey(txMeta);

      if (statusKey === 'failed') {
        toast.error(<ToastContent status="failed" />, {
          id: getEvmTransactionToastId(txMeta.id),
        });
        inFlightToastIdsRef.current.delete(txMeta.id);
        continue;
      }

      if (statusKey === 'confirmed') {
        toast.success(<ToastContent status="success" />, {
          id: getEvmTransactionToastId(txMeta.id),
        });
        inFlightToastIdsRef.current.delete(txMeta.id);
      }
    }
  }, [evmTransactions]);

  // Subscribe once and let the handlers start pending toasts from the earliest messenger events.
  useEffect(() => {
    let isActive = true;
    const unsubscribers: Unsubscribe[] = [];

    const handleEvent = (eventName: EventName) => (args: unknown[]) => {
      const txMeta = getTransactionMetaFromEventArgs(args);
      if (!txMeta?.id) {
        return;
      }

      const isEligible = isEvmTransactionEligibleForToast(
        txMeta,
        latestEligibilityCriteriaRef.current,
      );

      if (!isEligible) {
        return;
      }

      switch (eventName) {
        case 'TransactionController:transactionSubmitted':
          inFlightToastIdsRef.current.add(txMeta.id);
          toast.loading(<ToastContent status="pending" />, {
            id: getEvmTransactionToastId(txMeta.id),
          });
          break;
        case 'TransactionController:transactionConfirmed':
          if (getStatusKey(txMeta) === 'failed') {
            toast.error(<ToastContent status="failed" />, {
              id: getEvmTransactionToastId(txMeta.id),
            });
          } else {
            toast.success(<ToastContent status="success" />, {
              id: getEvmTransactionToastId(txMeta.id),
            });
          }
          inFlightToastIdsRef.current.delete(txMeta.id);
          break;
        case 'TransactionController:transactionFailed':
        case 'TransactionController:transactionDropped':
          toast.error(<ToastContent status="failed" />, {
            id: getEvmTransactionToastId(txMeta.id),
          });
          inFlightToastIdsRef.current.delete(txMeta.id);
          break;
        default:
          break;
      }
    };

    async function setupSubscriptions() {
      for (const eventName of EVENT_NAMES) {
        try {
          const unsubscribe = await subscribeToMessengerEvent<unknown[]>(
            eventName,
            handleEvent(eventName),
          );

          if (!isActive) {
            await unsubscribe();
            continue;
          }

          unsubscribers.push(unsubscribe);
        } catch {
          // Ignore subscription failures so toast handling does not break the UI.
        }
      }
    }

    setupSubscriptions().catch(() => {
      // Ignore subscription setup failures so toast handling does not break the UI.
    });

    return () => {
      isActive = false;
      unsubscribers.forEach((unsubscribe) => {
        unsubscribe().catch(() => {
          // Ignore unsubscribe failures during cleanup.
        });
      });
    };
  }, []);
}
