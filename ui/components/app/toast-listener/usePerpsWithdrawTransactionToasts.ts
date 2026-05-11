import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { TransactionStatus } from '@metamask/transaction-controller';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  selectPerpsWithdrawTransactionsForToast,
  type PerpsWithdrawToastTransaction,
} from '../../../selectors/toast';
import {
  showCustomFailedToast,
  showCustomPendingToast,
  showCustomSuccessToast,
} from './shared';

const PENDING_STATUSES = new Set<TransactionStatus>([
  TransactionStatus.approved,
  TransactionStatus.signed,
  TransactionStatus.submitted,
]);

const FAILED_STATUSES = new Set<TransactionStatus>([
  TransactionStatus.failed,
  TransactionStatus.dropped,
]);

function generateToastId(transactionId: string): string {
  return `perps-withdraw-${transactionId}`;
}

function getSuccessDescription(
  transaction: PerpsWithdrawToastTransaction,
  t: ReturnType<typeof useI18nContext>,
): string {
  if (!transaction.isPostQuote || transaction.targetFiat === undefined) {
    return t('perpsWithdrawPostQuoteToastSuccessGenericDescription');
  }

  return t('perpsWithdrawPostQuoteToastSuccessDescription', [
    `$${transaction.targetFiat.toFixed(2)}`,
    transaction.tokenSymbol,
  ]);
}

export function usePerpsWithdrawTransactionToasts() {
  const t = useI18nContext();
  const transactions = useSelector(selectPerpsWithdrawTransactionsForToast);
  const hasInitializedRef = useRef(false);
  const previousStatusesRef = useRef<Record<string, TransactionStatus | null>>(
    {},
  );
  const pendingToastShownIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const nextStatuses: Record<string, TransactionStatus | null> = {};

    for (const transaction of transactions) {
      nextStatuses[transaction.id] = transaction.status ?? null;
    }

    if (!hasInitializedRef.current) {
      previousStatusesRef.current = nextStatuses;
      hasInitializedRef.current = true;
      return;
    }

    for (const transaction of transactions) {
      const { id, status } = transaction;
      const previousStatus = previousStatusesRef.current[id];

      if (!status || previousStatus === status) {
        continue;
      }

      const toastId = generateToastId(id);

      if (
        PENDING_STATUSES.has(status) &&
        !pendingToastShownIdsRef.current.has(id)
      ) {
        pendingToastShownIdsRef.current.add(id);
        showCustomPendingToast(toastId, {
          title: t('perpsWithdrawPostQuoteToastPendingTitle'),
          description: t('perpsWithdrawPostQuoteToastPendingDescription'),
          dataTestId: 'perps-withdraw-pending-toast',
        });
        continue;
      }

      if (status === TransactionStatus.confirmed) {
        showCustomSuccessToast(toastId, {
          title: t('perpsWithdrawPostQuoteToastSuccessTitle'),
          description: getSuccessDescription(transaction, t),
          dataTestId: 'perps-withdraw-success-toast',
        });
        continue;
      }

      if (FAILED_STATUSES.has(status)) {
        showCustomFailedToast(toastId, {
          title: t('perpsWithdrawPostQuoteToastErrorTitle'),
          description: t('perpsWithdrawPostQuoteToastErrorDescription'),
          dataTestId: 'perps-withdraw-failed-toast',
        });
      }
    }

    previousStatusesRef.current = nextStatuses;
  }, [t, transactions]);
}
