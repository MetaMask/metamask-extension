import React, { useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useSelector } from 'react-redux';
import {
  selectNonEvmTransactionsForToast,
  // selectEvmTransactionsForToast,
} from '../../selectors/toast';
// import { useTransactionLifecycle } from '../../hooks/useTransactionLifecycle';
import { useNonEvmTransactionLifecycle } from '../../hooks/useNonEvmTransactionLifecycle';
import { useEvmTransactionMessengerToasts } from './useEvmTransactionMessengerToasts';
import { useBridgeSmartStatusToasts } from './useBridgeSmartStatusToasts';
import { useNonEvmTransactionMessengerToasts } from './useNonEvmTransactionMessengerToasts';
import {
  useTransactionDisplay,
  type TransactionStatus,
} from '../../helpers/utils/transaction-display';
import { getNonEvmTransactionToastId } from '../../helpers/utils/getTransactionToastId';
import { ToastContent as ToastContentBase } from '../../components/ui/toast/toast';
import type { Handlers } from '../../components/ui/toast/types';

// type EvmTx = ReturnType<typeof selectEvmTransactionsForToast>[number];
type NonEvmTx = ReturnType<typeof selectNonEvmTransactionsForToast>[number];

const ToastContent = ({ status }: { status: TransactionStatus }) => {
  const { title } = useTransactionDisplay(status);
  return <ToastContentBase title={title} />;
};

/**
 * Watches EVM transactions for status transitions and shows toast notifications
 */
// function useEvmTransactionToasts() {
//   const data = useSelector(selectEvmTransactionsForToast);
//
//   const handlers = useMemo<Handlers<EvmTx>>(
//     () => ({
//       onPending: (tx) => {
//         toast.loading(<ToastContent status="pending" />, {
//           id: `tx-${tx.id}`,
//         });
//       },
//       onSuccess: (tx) => {
//         toast.success(<ToastContent status="success" />, {
//           id: `tx-${tx.id}`,
//         });
//       },
//       onFailure: (tx) => {
//         toast.error(<ToastContent status="failed" />, {
//           id: `tx-${tx.id}`,
//         });
//       },
//     }),
//     [],
//   );
//
//   useTransactionLifecycle(data, handlers);
// }

/**
 * Watches non-EVM transactions for status transitions and shows toast notifications
 */
function useNonEvmTransactionToasts() {
  const data = useSelector(selectNonEvmTransactionsForToast);

  const handlers = useMemo<Handlers<NonEvmTx>>(
    () => ({
      onPending: (tx) => {
        toast.loading(<ToastContent status="pending" />, {
          id: getNonEvmTransactionToastId(tx.id),
        });
      },
      onSuccess: (tx) => {
        toast.success(<ToastContent status="success" />, {
          id: getNonEvmTransactionToastId(tx.id),
        });
      },
      onFailure: (tx) => {
        toast.error(<ToastContent status="failed" />, {
          id: getNonEvmTransactionToastId(tx.id),
        });
      },
    }),
    [],
  );

  useNonEvmTransactionLifecycle(data, handlers);
}

export function ToastListener() {
  // useEvmTransactionToasts();
  useEvmTransactionMessengerToasts();
  // useNonEvmTransactionToasts();
  useNonEvmTransactionMessengerToasts();
  useBridgeSmartStatusToasts();

  return null;
}
