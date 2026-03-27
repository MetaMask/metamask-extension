import { useEffect, useRef } from 'react';
import {
  isFailed,
  isPending,
  isSuccess,
} from '../helpers/constants/transactions';

type TransactionWithStatus = { id: string; status: string };

type Handlers<T extends TransactionWithStatus> = {
  onPending?: (tx: T) => void;
  onSuccess?: (tx: T) => void;
  onFailure?: (tx: T) => void;
};

/**
 * Generic hook that detects transaction lifecycle transitions.
 */
export function useTransactionLifecycle<T extends TransactionWithStatus>(
  transactions: readonly T[],
  handlers: Handlers<T>,
) {
  const ref = useRef<Map<string, T> | null>(null);

  useEffect(() => {
    const snapshot = ref.current;

    if (snapshot === null) {
      ref.current = new Map(transactions.map((tx) => [tx.id, tx]));
      return;
    }

    for (const tx of transactions) {
      const previous = snapshot.get(tx.id);

      if (!previous) {
        if (isPending(tx.status)) {
          handlers.onPending?.(tx);
        }
        continue;
      }

      if (!isPending(previous.status) && isPending(tx.status)) {
        handlers.onPending?.(tx);
      }

      if (isPending(previous.status) && isSuccess(tx.status)) {
        handlers.onSuccess?.(tx);
      }

      if (isPending(previous.status) && isFailed(tx.status)) {
        handlers.onFailure?.(tx);
      }
    }

    ref.current = new Map(transactions.map((tx) => [tx.id, tx]));
  }, [transactions, handlers]);
}
