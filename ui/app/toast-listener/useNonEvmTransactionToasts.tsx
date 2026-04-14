import React, { useEffect, useRef } from 'react';
import type { Json } from '@metamask/utils';
import type { Transaction } from '@metamask/keyring-api';
import { useSelector } from 'react-redux';
import {
  mapNonEvmToastStatus,
  getNonEvmTransactionToastId,
  extractTransactionsFromEvent,
} from './helpers';
import {
  isNonEvmTransactionEligibleForToast,
  selectNonEvmToastEligibility,
} from '../../selectors/toast';
import { subscribeToMessengerEvent } from '../../store/background-connection';
import { showToast } from './shared';

export function useNonEvmTransactionToasts() {
  const toastEligibility = useSelector(selectNonEvmToastEligibility);
  const toastEligibilityRef = useRef(toastEligibility);

  // Keep eligibility available without resubscribing
  useEffect(() => {
    toastEligibilityRef.current = toastEligibility;
  }, [toastEligibility]);

  // Remember the last seen status so we only toast on real changes
  const previousStatusesRef = useRef<Record<string, string>>({});

  // Subscribe to messenger events
  useEffect(() => {
    let isActive = true;
    const unsubscribers: (() => Promise<void>)[] = [];

    const handleTransaction = (tx: Transaction) => {
      if (
        !isNonEvmTransactionEligibleForToast(tx, toastEligibilityRef.current)
      ) {
        return;
      }

      const previousStatus = previousStatusesRef.current[tx.id];

      if (previousStatus === tx.status) {
        return;
      }

      previousStatusesRef.current[tx.id] = tx.status;

      const status = mapNonEvmToastStatus(tx);

      if (!status) {
        return;
      }

      if (previousStatus !== undefined || status === 'pending') {
        showToast(getNonEvmTransactionToastId(tx.id), status);
      }
    };

    const handleAccountTransactionsUpdated = (args: unknown[]) => {
      extractTransactionsFromEvent(args).forEach(handleTransaction);
    };

    async function setupSubscriptions() {
      try {
        const unsubscribe = await subscribeToMessengerEvent<Json[]>(
          'AccountsController:accountTransactionsUpdated',
          handleAccountTransactionsUpdated,
        );

        if (!isActive) {
          await unsubscribe();
          return;
        }

        unsubscribers.push(unsubscribe);
      } catch {
        // Ignore subscription failures
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
}
