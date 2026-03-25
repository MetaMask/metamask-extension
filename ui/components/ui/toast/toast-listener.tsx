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
  selectNonEvmTransactions,
  selectEvmTransactions,
} from '../../../selectors';
import { selectBridgeHistoryForAccountGroup } from '../../../ducks/bridge-status/selectors';
import {
  TRANSACTION_FAILED_STATUSES,
  TRANSACTION_PENDING_STATUSES,
  TRANSACTION_SUCCESS_STATUSES,
} from '../../../helpers/constants/transactions';
import { ToastContent } from './toast';

type TransactionLike = Pick<TransactionMeta, 'id' | 'status' | 'type'>;
type NonEvmTransactionLike = Pick<KeyringTransaction, 'id' | 'status' | 'type'>;

const isPendingStatus = (status: string) =>
  TRANSACTION_PENDING_STATUSES.some((s) => s === status);
const isSuccessStatus = (status: string) =>
  TRANSACTION_SUCCESS_STATUSES.some((s) => s === status);
const isFailedStatus = (status: string) =>
  TRANSACTION_FAILED_STATUSES.some((s) => s === status);

const isNonEvmSuccessStatus = (status: string) =>
  status === KeyringTransactionStatus.Confirmed;
const isNonEvmFailedStatus = (status: string) =>
  status === KeyringTransactionStatus.Failed;
const isNonEvmPendingStatus = (status: string) =>
  !isNonEvmSuccessStatus(status) && !isNonEvmFailedStatus(status);

const isBridgeHistoryPending = (item: BridgeHistoryItem) =>
  item.status.status === StatusTypes.PENDING;
const isBridgeHistoryComplete = (item: BridgeHistoryItem) =>
  item.status.status === StatusTypes.COMPLETE;
const isBridgeHistoryFailed = (item: BridgeHistoryItem) =>
  item.status.status === StatusTypes.FAILED;

export function ToastListener() {
  const evmTransactions = useSelector(selectEvmTransactions);
  const nonEvmTransactions = useSelector(selectNonEvmTransactions);
  const bridgeHistory = useSelector(selectBridgeHistoryForAccountGroup);

  const prevEvmTransactionsRef = useRef<readonly TransactionLike[]>([]);
  const prevNonEvmTransactionsRef = useRef<readonly NonEvmTransactionLike[]>(
    [],
  );
  const prevPendingNonEvmIdsRef = useRef<Set<string>>(new Set());
  const prevBridgeHistoryRef = useRef<Record<string, BridgeHistoryItem>>({});

  // Build a set of approval tx IDs used by EVM bridge operations so we can
  // skip them in the transactions watcher (txHistory handles bridge toasts).
  const bridgeApprovalTxIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(bridgeHistory ?? {}).forEach((item) => {
      if (item.approvalTxId) {
        ids.add(item.approvalTxId.toLowerCase());
      }
    });
    return ids;
  }, [bridgeHistory]);

  useEffect(() => {
    const prevTransactions = prevEvmTransactionsRef.current;
    const prevNonEvmTransactions = prevNonEvmTransactionsRef.current;
    const isFirstEvmRun = prevTransactions.length === 0;
    const isFirstNonEvmRun = prevNonEvmTransactions.length === 0;

    // Check for EVM transactions that became pending/success/failed
    for (const tx of evmTransactions) {
      if (isFirstEvmRun) {
        continue;
      }

      // Skip bridge approval txns
      if (bridgeApprovalTxIds.has(tx.id?.toLowerCase())) {
        continue;
      }

      const prevTx = prevTransactions.find((ptx) => ptx.id === tx.id);

      const becamePending =
        isPendingStatus(tx.status) &&
        (!prevTx || !isPendingStatus(prevTx.status));

      const becameSuccess =
        Boolean(prevTx) &&
        isSuccessStatus(tx.status) &&
        !isSuccessStatus(prevTx?.status ?? '');

      const becameFailed =
        Boolean(prevTx) &&
        isFailedStatus(tx.status) &&
        !isFailedStatus(prevTx?.status ?? '');

      if (!becamePending && !becameSuccess && !becameFailed) {
        continue;
      }

      const id = `tx-${tx.id}`;

      if (becamePending) {
        toast.loading(<ToastContent variant="pending" id={id} />, { id });
      } else if (becameSuccess) {
        toast.success(<ToastContent variant="success" id={id} />, { id });
      } else if (becameFailed) {
        toast.error(<ToastContent variant="failed" id={id} />, { id });
      }
    }

    // Non-EVM transactions don't have a pending status from the start
    const prevPendingNonEvmIds = prevPendingNonEvmIdsRef.current;
    const pendingNonEvmTxs = nonEvmTransactions.filter((tx) =>
      isNonEvmPendingStatus(tx.status),
    );
    const currentPendingNonEvmIds = new Set(
      pendingNonEvmTxs.map((tx) => tx.id),
    );

    // Show pending toasts for any new pending non-EVM transactions
    for (const tx of pendingNonEvmTxs) {
      if (isFirstNonEvmRun || prevPendingNonEvmIds.has(tx.id)) {
        continue;
      }

      const id = `non-evm-tx-${tx.id}`;
      toast.loading(<ToastContent variant="pending" id={id} />, { id });
    }

    // Check for non-EVM transactions that became success/failed
    for (const tx of nonEvmTransactions) {
      if (isFirstNonEvmRun) {
        continue;
      }

      const prevTx = prevNonEvmTransactions.find((ptx) => ptx.id === tx.id);

      const becameSuccess =
        isNonEvmSuccessStatus(tx.status) &&
        !isNonEvmSuccessStatus(prevTx?.status ?? '');

      const becameFailed =
        isNonEvmFailedStatus(tx.status) &&
        !isNonEvmFailedStatus(prevTx?.status ?? '');

      if (!becameSuccess && !becameFailed) {
        continue;
      }

      const id = `non-evm-tx-${tx.id}`;

      if (becameSuccess) {
        toast.success(<ToastContent variant="success" id={id} />, { id });
      } else if (becameFailed) {
        toast.error(<ToastContent variant="failed" id={id} />, { id });
      }
    }

    prevEvmTransactionsRef.current = evmTransactions;
    prevNonEvmTransactionsRef.current = nonEvmTransactions;
    prevPendingNonEvmIdsRef.current = currentPendingNonEvmIds;
  }, [evmTransactions, nonEvmTransactions, bridgeApprovalTxIds]);

  // Watch txHistory for non-EVM bridge transactions (Solana, BTC, etc.)
  useEffect(() => {
    const prevBridgeHistory = prevBridgeHistoryRef.current;
    const currentHistory = bridgeHistory ?? {};
    const isFirstRun = Object.keys(prevBridgeHistory).length === 0;

    for (const [key, item] of Object.entries(currentHistory)) {
      if (isFirstRun) {
        continue;
      }

      // Skip same-chain EVM swaps — those are handled by the EVM watcher.
      // Non-EVM same-chain swaps (e.g. Solana SOL→USDC) must still fire here.
      if (
        item.quote.srcChainId === item.quote.destChainId &&
        !isNonEvmChainId(item.quote.srcChainId)
      ) {
        continue;
      }

      const prevItem = prevBridgeHistory[key];
      const toastId = `bridge-tx-${key}`;

      const becamePending = !prevItem && isBridgeHistoryPending(item);

      const becameComplete =
        isBridgeHistoryComplete(item) &&
        prevItem &&
        !isBridgeHistoryComplete(prevItem);

      const becameFailed =
        isBridgeHistoryFailed(item) &&
        prevItem &&
        !isBridgeHistoryFailed(prevItem);

      if (becamePending) {
        toast.loading(<ToastContent variant="pending" id={toastId} />, {
          id: toastId,
        });
      } else if (becameComplete) {
        toast.success(<ToastContent variant="success" id={toastId} />, {
          id: toastId,
        });
      } else if (becameFailed) {
        toast.error(<ToastContent variant="failed" id={toastId} />, {
          id: toastId,
        });
      }
    }

    prevBridgeHistoryRef.current = currentHistory;
  }, [bridgeHistory]);

  return null;
}
