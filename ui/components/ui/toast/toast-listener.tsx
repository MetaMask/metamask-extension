import React, { useEffect, useMemo, useRef } from 'react';
import { type TransactionMeta } from '@metamask/transaction-controller';
import {
  TransactionStatus as KeyringTransactionStatus,
  type Transaction as KeyringTransaction,
} from '@metamask/keyring-api';
import { StatusTypes } from '@metamask/bridge-controller';
import { type BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
  selectNonEvmTransactionsForToast,
  selectEvmTransactionsForToast,
} from '../../../selectors';
import {
  selectBridgeHistoryForToast,
  selectNonEvmBridgeSourceTxIds,
} from '../../../ducks/bridge-status/selectors';
import {
  isFailed,
  isPending,
  isSuccess,
} from '../../../helpers/constants/transactions';
import { ToastContent } from './toast';

type TransactionLike = Pick<TransactionMeta, 'id' | 'status' | 'type'>;
type NonEvmTransactionLike = Pick<KeyringTransaction, 'id' | 'status' | 'type'>;

const isNonEvmSuccess = (status: string) =>
  status === KeyringTransactionStatus.Confirmed;
const isNonEvmFailed = (status: string) =>
  status === KeyringTransactionStatus.Failed;
const isNonEvmPending = (status: string) =>
  !isNonEvmSuccess(status) && !isNonEvmFailed(status);

const isBridgeComplete = (item: BridgeHistoryItem) =>
  item.status.status === StatusTypes.COMPLETE;
const isBridgeFailed = (item: BridgeHistoryItem) =>
  item.status.status === StatusTypes.FAILED;
const isBridgePending = (item: BridgeHistoryItem) =>
  item.status.status === StatusTypes.PENDING;

const options = {
  duration: Infinity,
};

function useBridgeApprovalTxIds() {
  const bridgeHistory = useSelector(selectBridgeHistoryForToast);
  return useMemo(() => {
    const ids = new Set<string>();
    for (const item of Object.values(bridgeHistory ?? {})) {
      if (item.approvalTxId) {
        ids.add(item.approvalTxId.toLowerCase());
      }
    }
    return ids;
  }, [bridgeHistory]);
}

function useEvmTransactionToasts() {
  const evmTransactions = useSelector(selectEvmTransactionsForToast);
  const bridgeApprovalTxIds = useBridgeApprovalTxIds();

  const prevEvmTransactionsRef = useRef<readonly TransactionLike[] | null>(
    null,
  );

  useEffect(() => {
    if (
      prevEvmTransactionsRef.current === null ||
      (prevEvmTransactionsRef.current.length === 0 &&
        evmTransactions.length > 0)
    ) {
      prevEvmTransactionsRef.current = evmTransactions;
      return;
    }

    const previousEvmTransactions = prevEvmTransactionsRef.current;

    for (const tx of evmTransactions) {
      // Skip bridge approval txns
      if (bridgeApprovalTxIds.has(tx.id?.toLowerCase())) {
        continue;
      }

      const previousTx = previousEvmTransactions.find(
        (ptx) => ptx.id === tx.id,
      );

      const becamePending =
        isPending(tx.status) && (!previousTx || !isPending(previousTx.status));

      const becameSuccess =
        Boolean(previousTx) &&
        isSuccess(tx.status) &&
        !isSuccess(previousTx?.status ?? '');

      const becameFailed =
        Boolean(previousTx) &&
        isFailed(tx.status) &&
        !isFailed(previousTx?.status ?? '');

      if (!becamePending && !becameSuccess && !becameFailed) {
        continue;
      }

      const id = `tx-${tx.id}`;

      if (becamePending) {
        toast.loading(<ToastContent variant="pending" />, {
          id,
          ...options,
        });
      } else if (becameSuccess) {
        toast.success(<ToastContent variant="success" />, {
          id,
          ...options,
        });
      } else if (becameFailed) {
        toast.error(<ToastContent variant="failed" />, {
          id,
          ...options,
        });
      }
    }

    prevEvmTransactionsRef.current = evmTransactions;
  }, [evmTransactions, bridgeApprovalTxIds]);
}

function useNonEvmTransactionToasts() {
  const nonEvmTransactions = useSelector(selectNonEvmTransactionsForToast);
  const nonEvmBridgeSourceTxIds = useSelector(selectNonEvmBridgeSourceTxIds);

  const prevNonEvmTransactionsRef = useRef<
    readonly NonEvmTransactionLike[] | null
  >(null);

  useEffect(() => {
    if (prevNonEvmTransactionsRef.current === null) {
      prevNonEvmTransactionsRef.current = nonEvmTransactions;
      return;
    }

    // Non-EVM txs load asynchronously after mount. When prev was empty and
    // items appear, distinguish between:
    //   (a) persisted txs async-loading on startup — all terminal → re-baseline
    //   (b) a brand new tx just submitted — has pending → fall through and toast
    if (
      prevNonEvmTransactionsRef.current.length === 0 &&
      nonEvmTransactions.length > 0 &&
      nonEvmTransactions.every(
        (tx) => isNonEvmSuccess(tx.status) || isNonEvmFailed(tx.status),
      )
    ) {
      prevNonEvmTransactionsRef.current = nonEvmTransactions;
      return;
    }

    const prevNonEvmTransactions = prevNonEvmTransactionsRef.current;

    const prevPendingIds = new Set(
      prevNonEvmTransactions
        .filter((tx) => isNonEvmPending(tx.status))
        .map((tx) => tx.id),
    );

    const pendingNonEvmTxs = nonEvmTransactions.filter((tx) =>
      isNonEvmPending(tx.status),
    );

    for (const tx of pendingNonEvmTxs) {
      if (prevPendingIds.has(tx.id) || nonEvmBridgeSourceTxIds.has(tx.id)) {
        continue;
      }

      toast.loading(<ToastContent variant="pending" />, {
        id: `non-evm-tx-${tx.id}`,
        ...options,
      });
    }

    // Check for non-EVM transactions that became success/failed
    for (const tx of nonEvmTransactions) {
      if (nonEvmBridgeSourceTxIds.has(tx.id)) {
        continue;
      }

      const prevTx = prevNonEvmTransactions.find((ptx) => ptx.id === tx.id);

      const becameSuccess =
        Boolean(prevTx) &&
        isNonEvmSuccess(tx.status) &&
        !isNonEvmSuccess(prevTx?.status ?? '');

      const becameFailed =
        Boolean(prevTx) &&
        isNonEvmFailed(tx.status) &&
        !isNonEvmFailed(prevTx?.status ?? '');

      if (!becameSuccess && !becameFailed) {
        continue;
      }

      const id = `non-evm-tx-${tx.id}`;

      if (becameSuccess) {
        toast.success(<ToastContent variant="success" />, {
          id,
          ...options,
        });
      } else if (becameFailed) {
        toast.error(<ToastContent variant="failed" />, {
          id,
          ...options,
        });
      }
    }

    prevNonEvmTransactionsRef.current = nonEvmTransactions;
  }, [nonEvmTransactions, nonEvmBridgeSourceTxIds]);
}

function useBridgeHistoryToasts() {
  const bridgeHistory = useSelector(selectBridgeHistoryForToast);

  const prevBridgeHistoryRef = useRef<Record<string, BridgeHistoryItem> | null>(
    null,
  );

  useEffect(() => {
    const currentHistory = bridgeHistory ?? {};

    // Bridge history loads in two phases: initially empty {}, then populated
    // from persisted state asynchronously. We snapshot twice — once on mount
    // (null sentinel) and again the first time items actually appear — so old
    // persisted items are never treated as "new".
    if (
      prevBridgeHistoryRef.current === null ||
      (Object.keys(prevBridgeHistoryRef.current).length === 0 &&
        Object.keys(currentHistory).length > 0)
    ) {
      prevBridgeHistoryRef.current = currentHistory;
      return;
    }

    const prevBridgeHistory = prevBridgeHistoryRef.current;

    for (const [key, item] of Object.entries(currentHistory)) {
      const id = `bridge-tx-${key}`;
      const prevItem = prevBridgeHistory[key];

      const becamePending = !prevItem && isBridgePending(item);
      const becameComplete =
        isBridgeComplete(item) && prevItem && !isBridgeComplete(prevItem);
      const becameFailed =
        isBridgeFailed(item) && prevItem && !isBridgeFailed(prevItem);

      if (!becamePending && !becameComplete && !becameFailed) {
        continue;
      }

      if (becamePending) {
        toast.loading(<ToastContent variant="pending" />, {
          id,
          ...options,
        });
      } else if (becameComplete) {
        toast.success(<ToastContent variant="success" />, {
          id,
          ...options,
        });
      } else if (becameFailed) {
        toast.error(<ToastContent variant="failed" />, {
          id,
          ...options,
        });
      }
    }

    prevBridgeHistoryRef.current = currentHistory;
  }, [bridgeHistory]);
}

export function ToastListener() {
  useEvmTransactionToasts();
  useNonEvmTransactionToasts();
  useBridgeHistoryToasts();

  return null;
}
