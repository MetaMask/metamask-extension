import { useEffect, useRef } from 'react';
import { TransactionStatus } from '@metamask/transaction-controller';
import {
  TRANSACTION_FAILED_STATUSES,
  TRANSACTION_PENDING_STATUSES,
  TRANSACTION_SUCCESS_STATUSES,
} from '../helpers/constants/transactions';
import type { Handlers } from '../components/ui/toast/types';
import { SmartTransactionStatus } from '../../shared/constants/transaction';

export const isSuccess = (status: TransactionStatus | SmartTransactionStatus) =>
  TRANSACTION_SUCCESS_STATUSES.has(status);
export const isFailed = (status: TransactionStatus | SmartTransactionStatus) =>
  TRANSACTION_FAILED_STATUSES.has(status);
export const isPending = (status: TransactionStatus | SmartTransactionStatus) =>
  TRANSACTION_PENDING_STATUSES.has(status);

export function useTransactionLifecycle<
  TTxn extends {
    id: string;
    status: TransactionStatus | SmartTransactionStatus;
  },
>(transactions: readonly TTxn[], handlers: Handlers<TTxn>) {
  const ref = useRef<Map<string, TTxn> | null>(null);

  useEffect(() => {
    const baseline = ref.current;

    if (baseline === null) {
      ref.current = new Map(transactions.map((tx) => [tx.id, tx]));
      return;
    }

    for (const tx of transactions) {
      const previous = baseline.get(tx.id);
      const isNowPending = isPending(tx.status);
      const isNowSuccess = isSuccess(tx.status);
      const isNowFailed = isFailed(tx.status);

      if (!previous) {
        if (isNowPending) {
          handlers.onPending?.(tx);
        }

        continue;
      }

      const wasPending = isPending(previous.status);

      if (wasPending && isNowSuccess) {
        handlers.onSuccess?.(tx);
      }

      if ((wasPending || previous.status === 'signed') && isNowFailed) {
        handlers.onFailure?.(tx);
      }
    }

    ref.current = new Map(transactions.map((tx) => [tx.id, tx]));
  }, [transactions, handlers]);
}
