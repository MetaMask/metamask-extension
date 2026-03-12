import React, { useEffect, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';
import { type TransactionMeta } from '@metamask/transaction-controller';
import {
  TransactionStatus as KeyringTransactionStatus,
  type Transaction as KeyringTransaction,
} from '@metamask/keyring-api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  getNonEvmToastTransactions,
  getPendingNonEvmToastTransactions,
  getToastTransactions,
} from '../../selectors';
import {
  TRANSACTION_FAILED_STATUSES,
  TRANSACTION_PENDING_STATUSES,
  TRANSACTION_SUCCESS_STATUSES,
} from '../../helpers/constants/transactions';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  getTransactionToastContent,
  type TransactionToastVariant,
} from '../ui/toast/transaction-toast-content';

type TransactionLike = Pick<TransactionMeta, 'id' | 'status' | 'type'>;

type NonEvmTransactionLike = Pick<KeyringTransaction, 'id' | 'status' | 'type'>;

const isPendingStatus = (status: string) =>
  TRANSACTION_PENDING_STATUSES.some(
    (pendingStatus) => pendingStatus === status,
  );
const isSuccessStatus = (status: string) =>
  TRANSACTION_SUCCESS_STATUSES.some(
    (successStatus) => successStatus === status,
  );
const isFailedStatus = (status: string) =>
  TRANSACTION_FAILED_STATUSES.some((failedStatus) => failedStatus === status);

const isNonEvmSuccessStatus = (status: string) =>
  status === KeyringTransactionStatus.Confirmed;

const isNonEvmFailedStatus = (status: string) =>
  status === KeyringTransactionStatus.Failed;

// eslint-disable-next-line @typescript-eslint/naming-convention
function ToastContent({
  variant,
  toastId,
}: {
  variant: TransactionToastVariant;
  toastId: string;
}) {
  const { title, description } = getTransactionToastContent(variant);

  return (
    <Link
      to={`${DEFAULT_ROUTE}?tab=activity`}
      onClick={() => toast.dismiss(toastId)}
      className="text-default no-underline"
    >
      <p className="text-m-body-md">{title}</p>
      {description ? (
        <p className="text-s-body-sm text-alternative">{description}</p>
      ) : null}
    </Link>
  );
}

export function TransactionToastListener() {
  const transactions = useSelector(getToastTransactions);
  const nonEvmTransactions = useSelector(getNonEvmToastTransactions);
  const pendingNonEvmTransactions = useSelector(
    getPendingNonEvmToastTransactions,
  );
  const prevTransactionsRef = useRef<readonly TransactionLike[]>([]);
  const prevNonEvmTransactionsRef = useRef<readonly NonEvmTransactionLike[]>(
    [],
  );
  const prevPendingNonEvmIdsRef = useRef<Set<string>>(new Set());
  const transactionList = transactions as readonly TransactionLike[];
  const nonEvmTransactionList = useMemo(
    () => (nonEvmTransactions as NonEvmTransactionLike[]) ?? [],
    [nonEvmTransactions],
  );
  const pendingNonEvmTransactionList = useMemo(
    () => (pendingNonEvmTransactions as NonEvmTransactionLike[]) ?? [],
    [pendingNonEvmTransactions],
  );

  useEffect(() => {
    const prevTransactions = prevTransactionsRef.current;
    const prevNonEvmTransactions = prevNonEvmTransactionsRef.current;
    const isFirstEvmRun = prevTransactions.length === 0;
    const isFirstNonEvmRun = prevNonEvmTransactions.length === 0;

    transactionList.forEach((tx) => {
      if (isFirstEvmRun) {
        return;
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
        return;
      }

      const toastId = `tx-${tx.id}`;

      if (becamePending) {
        toast.loading(<ToastContent variant="pending" toastId={toastId} />, {
          id: toastId,
        });
        return;
      }

      if (becameSuccess) {
        toast.success(<ToastContent variant="success" toastId={toastId} />, {
          id: toastId,
        });
        return;
      }

      if (becameFailed) {
        toast.error(<ToastContent variant="failed" toastId={toastId} />, {
          id: toastId,
        });
      }
    });

    const prevPendingNonEvmIds = prevPendingNonEvmIdsRef.current;
    const currentPendingNonEvmIds = new Set(
      pendingNonEvmTransactionList.map((tx) => tx.id),
    );

    pendingNonEvmTransactionList.forEach((tx) => {
      if (prevPendingNonEvmIds.has(tx.id)) {
        return;
      }

      const toastId = `non-evm-tx-${tx.id}`;
      toast.loading(<ToastContent variant="pending" toastId={toastId} />, {
        id: toastId,
      });
    });

    nonEvmTransactionList.forEach((tx) => {
      const prevTx = prevNonEvmTransactions.find((ptx) => ptx.id === tx.id);

      const becameSuccess =
        !isFirstNonEvmRun &&
        isNonEvmSuccessStatus(tx.status) &&
        !isNonEvmSuccessStatus(prevTx?.status ?? '');

      const becameFailed =
        !isFirstNonEvmRun &&
        isNonEvmFailedStatus(tx.status) &&
        !isNonEvmFailedStatus(prevTx?.status ?? '');

      if (!becameSuccess && !becameFailed) {
        return;
      }

      const toastId = `non-evm-tx-${tx.id}`;

      if (becameSuccess) {
        toast.dismiss('non-evm-pending-fallback');
        toast.success(<ToastContent variant="success" toastId={toastId} />, {
          id: toastId,
        });
        return;
      }

      if (becameFailed) {
        toast.dismiss('non-evm-pending-fallback');
        toast.error(<ToastContent variant="failed" toastId={toastId} />, {
          id: toastId,
        });
      }
    });

    prevTransactionsRef.current = transactionList;
    prevNonEvmTransactionsRef.current = nonEvmTransactionList;
    prevPendingNonEvmIdsRef.current = currentPendingNonEvmIds;
  }, [transactionList, nonEvmTransactionList, pendingNonEvmTransactionList]);

  return null;
}
