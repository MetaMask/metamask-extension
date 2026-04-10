import React, { useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
  selectNonEvmTransactionsForToast,
  selectEvmTransactionsForToast,
} from '../../selectors/toast';
import { selectBridgeHistoryForToast } from '../../ducks/bridge-status/selectors';
import { useTransactionLifecycle } from '../../hooks/useTransactionLifecycle';
import { useNonEvmTransactionLifecycle } from '../../hooks/useNonEvmTransactionLifecycle';
import { useBridgeHistoryLifecycle } from '../../hooks/useBridgeHistoryLifecycle';
import {
  useTransactionDisplay,
  type TransactionStatus,
} from '../../helpers/utils/transaction-display';
import { ToastContent as ToastContentBase } from '../../components/ui/toast/toast';
import type { Handlers } from '../../components/ui/toast/types';

type EvmTx = ReturnType<typeof selectEvmTransactionsForToast>[number];
type NonEvmTx = ReturnType<typeof selectNonEvmTransactionsForToast>[number];

const ToastContent = ({ status }: { status: TransactionStatus }) => {
  const { title } = useTransactionDisplay(status);
  return <ToastContentBase title={title} />;
};

/**
 * Watches EVM transactions for status transitions and shows toast notifications
 */
function useEvmTransactionToasts() {
  const data = useSelector(selectEvmTransactionsForToast);

  const handlers = useMemo<Handlers<EvmTx>>(
    () => ({
      onPending: (tx) => {
        toast.loading(<ToastContent status="pending" />, {
          id: `tx-${tx.id}`,
        });
      },
      onSuccess: (tx) => {
        toast.success(<ToastContent status="success" />, {
          id: `tx-${tx.id}`,
        });
      },
      onFailure: (tx) => {
        toast.error(<ToastContent status="failed" />, {
          id: `tx-${tx.id}`,
        });
      },
    }),
    [],
  );

  useTransactionLifecycle(data, handlers);
}

/**
 * Watches non-EVM transactions for status transitions and shows toast notifications
 */
function useNonEvmTransactionToasts() {
  const data = useSelector(selectNonEvmTransactionsForToast);

  const handlers = useMemo<Handlers<NonEvmTx>>(
    () => ({
      onPending: (tx) => {
        toast.loading(<ToastContent status="pending" />, {
          id: `non-evm-tx-${tx.id}`,
        });
      },
      onSuccess: (tx) => {
        toast.success(<ToastContent status="success" />, {
          id: `non-evm-tx-${tx.id}`,
        });
      },
      onFailure: (tx) => {
        toast.error(<ToastContent status="failed" />, {
          id: `non-evm-tx-${tx.id}`,
        });
      },
    }),
    [],
  );

  useNonEvmTransactionLifecycle(data, handlers);
}

/**
 * Watches bridge history for status transitions and shows toast notifications
 */
function useBridgeHistoryToasts() {
  const data = useSelector(selectBridgeHistoryForToast);

  const handlers = useMemo(
    () => ({
      onPending: (key: string) => {
        toast.loading(<ToastContent status="pending" />, {
          id: `bridge-tx-${key}`,
        });
      },
      onSuccess: (key: string) => {
        toast.success(<ToastContent status="success" />, {
          id: `bridge-tx-${key}`,
        });
      },
      onFailure: (key: string) => {
        toast.error(<ToastContent status="failed" />, {
          id: `bridge-tx-${key}`,
        });
      },
    }),
    [],
  );

  useBridgeHistoryLifecycle(data, handlers);
}

export function ToastListener() {
  useEvmTransactionToasts();
  useNonEvmTransactionToasts();
  useBridgeHistoryToasts();

  return null;
}
