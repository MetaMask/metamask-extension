import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { TransactionStatus } from '@metamask/transaction-controller';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  selectPerpsWithdrawTransactionsForToast,
  type PerpsWithdrawToastTransaction,
} from '../../../selectors/toast';
import {
  dismissToast,
  showFailedToast,
  showPendingToast,
  showSuccessToast,
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

type TransactionStatusesById = Record<string, TransactionStatus | null>;
type I18nTranslator = ReturnType<typeof useI18nContext>;

function generateToastId(transactionId: string): string {
  return `perps-withdraw-${transactionId}`;
}

function getTransactionStatusesById(
  transactions: PerpsWithdrawToastTransaction[],
): TransactionStatusesById {
  const statuses: TransactionStatusesById = {};

  for (const transaction of transactions) {
    statuses[transaction.id] = transaction.status ?? null;
  }

  return statuses;
}

function getSuccessDescription(
  transaction: PerpsWithdrawToastTransaction,
  t: I18nTranslator,
): string {
  if (!transaction.isPostQuote || transaction.targetFiat === undefined) {
    return t('perpsWithdrawPostQuoteToastSuccessGenericDescription');
  }

  return t('perpsWithdrawPostQuoteToastSuccessDescription', [
    `$${transaction.targetFiat.toFixed(2)}`,
    transaction.tokenSymbol,
  ]);
}

function showPendingWithdrawToast(toastId: string, t: I18nTranslator): void {
  showPendingToast(toastId, {
    title: t('perpsWithdrawPostQuoteToastPendingTitle'),
    description: t('perpsWithdrawPostQuoteToastPendingDescription'),
    dataTestId: 'perps-withdraw-pending-toast',
  });
}

function showSuccessWithdrawToast(
  toastId: string,
  transaction: PerpsWithdrawToastTransaction,
  t: I18nTranslator,
): void {
  showSuccessToast(toastId, {
    title: t('perpsWithdrawPostQuoteToastSuccessTitle'),
    description: getSuccessDescription(transaction, t),
    dataTestId: 'perps-withdraw-success-toast',
  });
}

function showFailedWithdrawToast(toastId: string, t: I18nTranslator): void {
  showFailedToast(toastId, {
    title: t('perpsWithdrawPostQuoteToastErrorTitle'),
    description: t('perpsWithdrawPostQuoteToastErrorDescription'),
    dataTestId: 'perps-withdraw-failed-toast',
  });
}

function handleChangedWithdrawTransaction({
  transaction,
  previousStatus,
  pendingToastShownIds,
  t,
}: {
  transaction: PerpsWithdrawToastTransaction;
  previousStatus: TransactionStatus | null | undefined;
  pendingToastShownIds: Set<string>;
  t: I18nTranslator;
}): void {
  const { id, status } = transaction;

  if (!status || previousStatus === status) {
    return;
  }

  const toastId = generateToastId(id);

  if (PENDING_STATUSES.has(status) && !pendingToastShownIds.has(id)) {
    pendingToastShownIds.add(id);
    showPendingWithdrawToast(toastId, t);
    return;
  }

  if (status === TransactionStatus.confirmed) {
    showSuccessWithdrawToast(toastId, transaction, t);
    return;
  }

  if (FAILED_STATUSES.has(status)) {
    showFailedWithdrawToast(toastId, t);
  }
}

function dismissRemovedPendingToasts({
  previousStatuses,
  nextStatuses,
  pendingToastShownIds,
}: {
  previousStatuses: TransactionStatusesById;
  nextStatuses: TransactionStatusesById;
  pendingToastShownIds: Set<string>;
}): void {
  for (const [id, previousStatus] of Object.entries(previousStatuses)) {
    if (!previousStatus || !PENDING_STATUSES.has(previousStatus)) {
      continue;
    }

    if (id in nextStatuses) {
      continue;
    }

    dismissToast(generateToastId(id));
    pendingToastShownIds.delete(id);
  }
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
    const nextStatuses = getTransactionStatusesById(transactions);

    if (!hasInitializedRef.current) {
      previousStatusesRef.current = nextStatuses;
      hasInitializedRef.current = true;
      return;
    }

    for (const transaction of transactions) {
      handleChangedWithdrawTransaction({
        transaction,
        previousStatus: previousStatusesRef.current[transaction.id],
        pendingToastShownIds: pendingToastShownIdsRef.current,
        t,
      });
    }

    dismissRemovedPendingToasts({
      previousStatuses: previousStatusesRef.current,
      nextStatuses,
      pendingToastShownIds: pendingToastShownIdsRef.current,
    });

    previousStatusesRef.current = nextStatuses;
  }, [t, transactions]);
}
