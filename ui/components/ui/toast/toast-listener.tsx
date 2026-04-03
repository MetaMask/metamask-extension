import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { toast } from '../../../../shared/lib/toast';
import {
  selectNonEvmTransactionsForToast,
  selectEvmTransactionsForToast,
} from '../../../selectors/toast';
import { selectBridgeHistoryForToast } from '../../../ducks/bridge-status/selectors';
import { useTransactionLifecycle } from '../../../hooks/useTransactionLifecycle';
import { useNonEvmTransactionLifecycle } from '../../../hooks/useNonEvmTransactionLifecycle';
import { useBridgeHistoryLifecycle } from '../../../hooks/useBridgeHistoryLifecycle';
import {
  TransactionStatus,
  useTransactionDisplay,
} from '../../../helpers/utils/transaction-display';
import { useConnectAccountToast } from '../../../hooks/useConnectAccountToast';
import { ToastContent } from './toast';
import type { Handlers } from './types';

type EvmTx = ReturnType<typeof selectEvmTransactionsForToast>[number];
type NonEvmTx = ReturnType<typeof selectNonEvmTransactionsForToast>[number];

const Content = ({ status }: { status: TransactionStatus }) => {
  const { title } = useTransactionDisplay(status);
  return <ToastContent title={title} />;
};

/**
 * Watches EVM transactions for status transitions and shows toast notifications
 */
function useEvmTransactionToasts() {
  const data = useSelector(selectEvmTransactionsForToast);

  const handlers = useMemo<Handlers<EvmTx>>(
    () => ({
      onPending: (tx) => {
        toast.loading(<Content status="pending" />, {
          id: `tx-${tx.id}`,
        });
      },
      onSuccess: (tx) => {
        toast.success(<Content status="success" />, {
          id: `tx-${tx.id}`,
        });
      },
      onFailure: (tx) => {
        toast.error(<Content status="failed" />, {
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
        toast.loading(<Content status="pending" />, {
          id: `non-evm-tx-${tx.id}`,
        });
      },
      onSuccess: (tx) => {
        toast.success(<Content status="success" />, {
          id: `non-evm-tx-${tx.id}`,
        });
      },
      onFailure: (tx) => {
        toast.error(<Content status="failed" />, {
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
        toast.loading(<Content status="pending" />, {
          id: `bridge-tx-${key}`,
        });
      },
      onSuccess: (key: string) => {
        toast.success(<Content status="success" />, {
          id: `bridge-tx-${key}`,
        });
      },
      onFailure: (key: string) => {
        toast.error(<Content status="failed" />, {
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
  useConnectAccountToast();

  return null;
}
