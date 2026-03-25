import React, { useEffect, useMemo, useRef } from 'react';
import { type TransactionMeta } from '@metamask/transaction-controller';
import {
  TransactionStatus as KeyringTransactionStatus,
  type Transaction as KeyringTransaction,
} from '@metamask/keyring-api';
import { StatusTypes, isNonEvmChainId } from '@metamask/bridge-controller';
import { type BridgeHistoryItem } from '@metamask/bridge-status-controller';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
  selectNonEvmTransactionsForToast,
  selectEvmTransactionsForToast,
} from '../../../selectors';
import {
  selectBridgeHistoryForAccountGroup,
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
  const bridgeHistory = useSelector(selectBridgeHistoryForAccountGroup);
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

  const prevEvmTransactionsRef = useRef<readonly TransactionLike[]>([]);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const previousEvmTransactions = prevEvmTransactionsRef.current;
    const isFirstRun = !hasMountedRef.current;

    for (const tx of evmTransactions) {
      if (isFirstRun) {
        continue;
      }

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
    hasMountedRef.current = true;
  }, [evmTransactions, bridgeApprovalTxIds]);
}

function useNonEvmTransactionToasts() {
  const nonEvmTransactions = useSelector(selectNonEvmTransactionsForToast);
  const nonEvmBridgeSourceTxIds = useSelector(selectNonEvmBridgeSourceTxIds);

  const prevPendingNonEvmIdsRef = useRef<Set<string>>(new Set());
  const prevNonEvmTransactionsRef = useRef<readonly NonEvmTransactionLike[]>(
    [],
  );
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const prevNonEvmTransactions = prevNonEvmTransactionsRef.current;
    const isFirstRun = !hasMountedRef.current;

    const previousPendingNonEvmIds = prevPendingNonEvmIdsRef.current;
    const pendingNonEvmTxs = nonEvmTransactions.filter((tx) =>
      isNonEvmPending(tx.status),
    );
    const currentPendingNonEvmIds = new Set(
      pendingNonEvmTxs.map((tx) => tx.id),
    );

    for (const tx of pendingNonEvmTxs) {
      if (
        isFirstRun ||
        previousPendingNonEvmIds.has(tx.id) ||
        nonEvmBridgeSourceTxIds.has(tx.id)
      ) {
        continue;
      }

      toast.loading(<ToastContent variant="pending" />, {
        id: `non-evm-tx-${tx.id}`,
        ...options,
      });
    }

    // Check for non-EVM transactions that became success/failed
    for (const tx of nonEvmTransactions) {
      if (isFirstRun || nonEvmBridgeSourceTxIds.has(tx.id)) {
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
        toast.success(<ToastContent variant="success" />, { id, ...options });
      } else if (becameFailed) {
        toast.error(<ToastContent variant="failed" />, { id, ...options });
      }
    }

    prevNonEvmTransactionsRef.current = nonEvmTransactions;
    hasMountedRef.current = true;
    prevPendingNonEvmIdsRef.current = currentPendingNonEvmIds;
  }, [nonEvmTransactions, nonEvmBridgeSourceTxIds]);
}

function useBridgeHistoryToasts() {
  const bridgeHistory = useSelector(selectBridgeHistoryForAccountGroup);

  const prevBridgeHistoryRef = useRef<Record<string, BridgeHistoryItem>>({});
  const hasMountedRef = useRef(false);

  useEffect(() => {
    const prevBridgeHistory = prevBridgeHistoryRef.current;
    const currentHistory = bridgeHistory ?? {};
    const isFirstRun = !hasMountedRef.current;

    for (const [key, item] of Object.entries(currentHistory)) {
      // Skip same-chain EVM swaps — those are handled by the EVM watcher.
      // Non-EVM same-chain swaps (e.g. Solana SOL→USDC) must still fire here.
      if (
        item.quote.srcChainId === item.quote.destChainId &&
        !isNonEvmChainId(item.quote.srcChainId)
      ) {
        continue;
      }

      const id = `bridge-tx-${key}`;

      if (isFirstRun) {
        continue;
      }

      const prevItem = prevBridgeHistory[key];

      const becamePending = !prevItem && isBridgePending(item);
      const becameComplete =
        isBridgeComplete(item) && prevItem && !isBridgeComplete(prevItem);
      const becameFailed =
        isBridgeFailed(item) && prevItem && !isBridgeFailed(prevItem);

      if (becamePending) {
        toast.loading(<ToastContent variant="pending" />, { id, ...options });
      } else if (becameComplete) {
        toast.success(<ToastContent variant="success" />, { id, ...options });
      } else if (becameFailed) {
        toast.error(<ToastContent variant="failed" />, { id, ...options });
      }
    }

    prevBridgeHistoryRef.current = currentHistory;
    hasMountedRef.current = true;
  }, [bridgeHistory]);
}

export function ToastListener() {
  useEvmTransactionToasts();
  useNonEvmTransactionToasts();
  useBridgeHistoryToasts();

  return null;
}
