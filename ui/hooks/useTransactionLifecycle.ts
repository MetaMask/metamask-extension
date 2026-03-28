import { useEffect, useRef } from 'react';
import {
  isFailed,
  isPending,
  isSuccess,
} from '../helpers/constants/transactions';
import type { Handlers } from '../components/ui/toast/types';

export function useTransactionLifecycle<
  TTxn extends { id: string; status: string },
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

      if (!previous) {
        if (isPending(tx.status)) {
          handlers.onPending?.(tx);
        } else if (isSuccess(tx.status)) {
          handlers.onSuccess?.(tx);
        } else if (isFailed(tx.status)) {
          handlers.onFailure?.(tx);
        }
        continue;
      }

      if (!isPending(previous.status) && isPending(tx.status)) {
        handlers.onPending?.(tx);
      }

      if (isPending(previous.status) && isSuccess(tx.status)) {
        handlers.onSuccess?.(tx);
      }

      if (
        (isPending(previous.status) || previous.status === 'signed') &&
        isFailed(tx.status)
      ) {
        handlers.onFailure?.(tx);
      }
    }

    ref.current = new Map(transactions.map((tx) => [tx.id, tx]));
  }, [transactions, handlers]);
}
