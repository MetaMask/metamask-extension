import { useCallback, useEffect, useRef, useState } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { submitRequestToBackground } from '../../../store/background-connection';

type TxStatus = TransactionMeta['status'];

export type BatchSignState = {
  txIds: string[];
  statuses: TxStatus[];
  batchId: string | undefined;
  approveSigned: boolean;
  swapSigned: boolean;
  allSigned: boolean;
  anyFailed: boolean;
  waitingForNext: boolean;
};

const EMPTY_RESULT: BatchSignState = {
  txIds: [],
  statuses: [],
  batchId: undefined,
  approveSigned: false,
  swapSigned: false,
  allSigned: false,
  anyFailed: false,
  waitingForNext: false,
};

const isSigned = (status: TxStatus) =>
  status === 'signed' || status === 'submitted' || status === 'confirmed';

async function fetchBatchTxs(
  fromAddress: string | undefined,
): Promise<TransactionMeta[]> {
  if (!fromAddress) {
    return [];
  }
  const state = await submitRequestToBackground<{
    transactions: TransactionMeta[];
  }>('messengerCall', ['TransactionController:getState']);
  console.log(
    '[HW-Batch] TC state tx count',
    state?.transactions?.length,
    'from',
    fromAddress,
  );
  const filtered = state.transactions
    .filter(
      (tx: TransactionMeta) => tx.batchId && tx.txParams.from === fromAddress,
    )
    .slice(-2);
  console.log('[HW-Batch] filtered batch txs', filtered.length, filtered);
  return filtered;
}

export function useBatchSignStatus(
  fromAddress: string | undefined,
): BatchSignState {
  const [txs, setTxs] = useState<TransactionMeta[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!fromAddress) {
      setTxs([]);
      return undefined;
    }
    const intervalId = setInterval(() => {
      fetchBatchTxs(fromAddress)
        .then((result) => {
          if (mountedRef.current) {
            setTxs(result);
          }
        })
        .catch((err: unknown) => {
          console.error('[HW-Batch] fetchBatchTxs error', err);
        });
    }, 250);
    return () => {
      clearInterval(intervalId);
    };
  }, [fromAddress]);

  const computeState = useCallback(
    (currentTxs: TransactionMeta[]): BatchSignState => {
      if (!fromAddress || currentTxs.length === 0) {
        return EMPTY_RESULT;
      }

      const { batchId } = currentTxs[0];
      const statuses = currentTxs.map((t: TransactionMeta) => t.status);
      const signedCount = statuses.filter(isSigned).length;
      const failedCount = statuses.filter(
        (s: TxStatus) => s === 'failed',
      ).length;

      return {
        txIds: currentTxs.map((t: TransactionMeta) => t.id),
        statuses,
        batchId,
        approveSigned: currentTxs.length >= 1 ? isSigned(statuses[0]) : false,
        swapSigned: currentTxs.length >= 2 ? isSigned(statuses[1]) : false,
        allSigned: currentTxs.length >= 2 && signedCount === currentTxs.length,
        anyFailed: failedCount > 0,
        waitingForNext: signedCount === 1 && currentTxs.length < 2,
      };
    },
    [fromAddress],
  );

  return computeState(txs);
}
