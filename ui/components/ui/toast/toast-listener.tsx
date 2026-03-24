import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { type TransactionMeta } from '@metamask/transaction-controller';
import {
  TransactionStatus as KeyringTransactionStatus,
  type Transaction as KeyringTransaction,
} from '@metamask/keyring-api';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import {
  selectNonEvmTransactions,
  selectEvmTransactions,
} from '../../../selectors';
import {
  TRANSACTION_FAILED_STATUSES,
  TRANSACTION_PENDING_STATUSES,
  TRANSACTION_SUCCESS_STATUSES,
} from '../../../helpers/constants/transactions';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  getTransactionDisplayData,
  type TransactionStatusVariant,
} from '../../../helpers/utils/transaction-display';

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

const ToastContent = ({
  variant,
  toastId,
}: {
  variant: TransactionStatusVariant;
  toastId: string;
}) => {
  const { title, description } = getTransactionDisplayData(variant);

  return (
    <Link
      to={`${DEFAULT_ROUTE}?tab=activity`}
      onClick={() => toast.dismiss(toastId)}
      className="hover:text-default no-underline before:absolute before:inset-0"
    >
      <p className="text-m-body-md">{title}</p>

      {description ? (
        <p className="text-s-body-sm text-alternative">{description}</p>
      ) : null}
    </Link>
  );
};

export function ToastListener() {
  const transactions = useSelector(
    selectEvmTransactions,
  ) as readonly TransactionLike[];
  const nonEvmTransactions = useSelector(
    selectNonEvmTransactions,
  ) as readonly NonEvmTransactionLike[];
  const prevTransactionsRef = useRef<readonly TransactionLike[]>([]);
  const prevNonEvmTransactionsRef = useRef<readonly NonEvmTransactionLike[]>(
    [],
  );
  const prevPendingNonEvmIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const prevTransactions = prevTransactionsRef.current;
    const prevNonEvmTransactions = prevNonEvmTransactionsRef.current;
    const isFirstEvmRun = prevTransactions.length === 0;
    const isFirstNonEvmRun = prevNonEvmTransactions.length === 0;

    transactions.forEach((tx) => {
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
    const pendingNonEvmTxs = nonEvmTransactions.filter((tx) =>
      isNonEvmPendingStatus(tx.status),
    );
    const currentPendingNonEvmIds = new Set(
      pendingNonEvmTxs.map((tx) => tx.id),
    );

    pendingNonEvmTxs.forEach((tx) => {
      if (prevPendingNonEvmIds.has(tx.id)) {
        return;
      }

      const toastId = `non-evm-tx-${tx.id}`;
      toast.loading(<ToastContent variant="pending" toastId={toastId} />, {
        id: toastId,
      });
    });

    nonEvmTransactions.forEach((tx) => {
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

    prevTransactionsRef.current = transactions;
    prevNonEvmTransactionsRef.current = nonEvmTransactions;
    prevPendingNonEvmIdsRef.current = currentPendingNonEvmIds;
  }, [transactions, nonEvmTransactions]);

  return null;
}
