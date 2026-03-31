import { useEffect, useRef } from 'react';
import { TransactionStatus as Status } from '@metamask/keyring-api';
import type { Handlers } from '../components/ui/toast/types';

const isSuccess = (status: string) => status === Status.Confirmed;
const isFailed = (status: string) => status === Status.Failed;

const recencyThreshold = 60_000;
const isRecent = (timestampSec?: number | null) => {
  if (typeof timestampSec !== 'number') {
    return false;
  }

  return Date.now() - timestampSec * 1000 <= recencyThreshold;
};

export function useNonEvmTransactionLifecycle<
  TTxn extends { id: string; status: string; timestamp?: number | null },
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
      const isNowSuccess = isSuccess(tx.status);
      const isNowFailed = isFailed(tx.status);

      if (!previous) {
        if (!isRecent(tx.timestamp)) {
          continue;
        }

        if (isNowFailed) {
          handlers.onFailure?.(tx);
        } else if (isNowSuccess) {
          handlers.onSuccess?.(tx);
        }

        continue;
      }

      if (!isSuccess(previous.status) && isNowSuccess) {
        handlers.onSuccess?.(tx);
      }

      if (!isFailed(previous.status) && isNowFailed) {
        handlers.onFailure?.(tx);
      }
    }

    ref.current = new Map(transactions.map((tx) => [tx.id, tx]));
  }, [transactions, handlers]);
}
