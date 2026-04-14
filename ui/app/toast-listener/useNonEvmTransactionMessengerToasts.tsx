import React, { useEffect, useRef } from 'react';
import type { Transaction } from '@metamask/keyring-api';
import { TransactionStatus } from '@metamask/keyring-api';
import { useSelector } from 'react-redux';
import {
  getNonEvmToastStatus,
  getNonEvmTransactionToastId,
} from '../../helpers/utils/toasts';
import {
  type NonEvmToastEligibilityCriteria,
  isNonEvmTransactionEligibleForToast,
  selectNonEvmToastEligibilityCriteria,
} from '../../selectors/toast';
import { subscribeToMessengerEvent } from '../../store/background-connection';
import { showPendingToast, showSuccessToast, showFailedToast } from './shared';

type Unsubscribe = () => Promise<void>;

function getUpdatedTransactionsFromAccountUpdateArgs(
  args: unknown[],
): Transaction[] {
  const firstArg = args?.[0] as
    | { transactions?: Record<string, Transaction[]> }
    | undefined;

  if (!firstArg?.transactions) {
    return [];
  }

  return Object.values(firstArg.transactions).flat();
}

export function useNonEvmTransactionMessengerToasts() {
  const nonEvmToastEligibilityCriteria = useSelector(
    selectNonEvmToastEligibilityCriteria,
  ) as NonEvmToastEligibilityCriteria;

  // Stable callbacks read the latest non-EVM eligibility inputs from this ref.
  const latestEligibilityCriteriaRef = useRef<NonEvmToastEligibilityCriteria>(
    nonEvmToastEligibilityCriteria,
  );
  // Remembers the last seen status so we only toast on real changes.
  const previousStatusesRef = useRef<Record<string, TransactionStatus>>({});

  useEffect(() => {
    latestEligibilityCriteriaRef.current = nonEvmToastEligibilityCriteria;
  }, [nonEvmToastEligibilityCriteria]);

  // Subscribe once to raw non-EVM transaction updates and map statuses directly to toasts.
  useEffect(() => {
    let isActive = true;
    const unsubscribers: Unsubscribe[] = [];

    const showToastForStatus = (
      transaction: Transaction,
      status: 'pending' | 'success' | 'failed',
    ) => {
      const id = getNonEvmTransactionToastId(transaction.id);
      if (status === 'pending') {
        showPendingToast(id);
      } else if (status === 'success') {
        showSuccessToast(id);
      } else {
        showFailedToast(id);
      }
    };

    const handleTransaction = (transaction: Transaction) => {
      if (
        !isNonEvmTransactionEligibleForToast(
          transaction,
          latestEligibilityCriteriaRef.current,
        )
      ) {
        return;
      }

      const previousStatus = previousStatusesRef.current[transaction.id];
      if (previousStatus === transaction.status) {
        return;
      }

      previousStatusesRef.current[transaction.id] = transaction.status;

      const toastStatus = getNonEvmToastStatus(transaction);

      if (!toastStatus) {
        return;
      }

      if (previousStatus !== undefined || toastStatus === 'pending') {
        showToastForStatus(transaction, toastStatus);
      }
    };

    const handleAccountTransactionsUpdated = (args: unknown[]) => {
      getUpdatedTransactionsFromAccountUpdateArgs(args).forEach(
        handleTransaction,
      );
    };

    async function setupSubscriptions() {
      try {
        const unsubscribe = await subscribeToMessengerEvent<unknown[]>(
          'AccountsController:accountTransactionsUpdated',
          handleAccountTransactionsUpdated,
        );

        if (!isActive) {
          await unsubscribe();
          return;
        }

        unsubscribers.push(unsubscribe);
      } catch {
        // Ignore subscription failures so toast handling does not break the UI.
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
