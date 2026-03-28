import { useEffect, useRef } from 'react';
import { TransactionStatus as Status } from '@metamask/keyring-api';
import type { Handlers } from '../components/ui/toast/types';

const isSuccess = (status: string) => status === Status.Confirmed;
const isFailed = (status: string) => status === Status.Failed;

export function useNonEvmTransactionLifecycle<
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
        if (isFailed(tx.status)) {
          handlers.onFailure?.(tx);
        } else if (isSuccess(tx.status)) {
          handlers.onSuccess?.(tx);
        } else {
          handlers.onPending?.(tx);
        }
        continue;
      }

      if (!isSuccess(previous.status) && isSuccess(tx.status)) {
        handlers.onSuccess?.(tx);
      }

      if (!isFailed(previous.status) && isFailed(tx.status)) {
        handlers.onFailure?.(tx);
      }
    }

    ref.current = new Map(transactions.map((tx) => [tx.id, tx]));
  }, [transactions, handlers]);
}
