import { useEffect, useRef } from 'react';
import {
  isFailed,
  isPending,
  isSuccess,
} from '../helpers/constants/transactions';

type TransactionWithStatus = { id: string; status: string };

type Handlers<Ttxn extends TransactionWithStatus> = {
  onPending?: (tx: Ttxn) => void;
  onSuccess?: (tx: Ttxn) => void;
  onFailure?: (tx: Ttxn) => void;
};

export function useTransactionLifecycle<Ttxn extends TransactionWithStatus>(
  transactions: readonly Ttxn[],
  handlers: Handlers<Ttxn>,
) {
  const ref = useRef<Map<string, Ttxn> | null>(null);

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
