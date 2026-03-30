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
      const isNowPending = isPending(tx.status);
      const isNowSuccess = isSuccess(tx.status);
      const isNowFailed = isFailed(tx.status);

      if (!previous) {
        if (isNowPending) {
          handlers.onPending?.(tx);
        } else if (isNowSuccess) {
          handlers.onSuccess?.(tx);
        } else if (isNowFailed) {
          handlers.onFailure?.(tx);
        }
        continue;
      }

      const wasPending = isPending(previous.status);

      if (!wasPending && isNowPending) {
        handlers.onPending?.(tx);
        continue;
      }

      if (wasPending && isNowSuccess) {
        handlers.onSuccess?.(tx);
        continue;
      }

      if ((wasPending || previous.status === 'signed') && isNowFailed) {
        handlers.onFailure?.(tx);
      }
    }

    ref.current = new Map(transactions.map((tx) => [tx.id, tx]));
  }, [transactions, handlers]);
}
