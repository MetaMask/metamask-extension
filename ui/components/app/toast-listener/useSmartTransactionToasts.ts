import { useEffect, useRef } from 'react';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller';
import { TransactionStatus as EvmTransactionStatus } from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import { resolvePendingApproval } from '../../../store/actions';
import { selectSmartTransactions } from '../../../selectors/toast';
import {
  dismissToast,
  showFailedToast,
  showPendingToast,
  showSuccessToast,
  type ToastStatus,
} from './shared';

function generateToastId(txId: string) {
  return `stx-${txId}`;
}

export const smartTransactionEvmFailureStatuses = new Set<string>([
  EvmTransactionStatus.failed,
  EvmTransactionStatus.dropped,
  EvmTransactionStatus.rejected,
  EvmTransactionStatus.cancelled,
]);

export const smartTransactionFailureStatuses = new Set<string>([
  SmartTransactionStatuses.CANCELLED,
  SmartTransactionStatuses.CANCELLED_USER_CANCELLED,
  SmartTransactionStatuses.REVERTED,
  SmartTransactionStatuses.UNKNOWN,
]);

export function mapSmartTransactionToastStatus(
  status?: string,
  evmStatus?: string,
): ToastStatus | undefined {
  if (status === SmartTransactionStatuses.SUCCESS) {
    return 'success';
  }

  if (status && smartTransactionFailureStatuses.has(status)) {
    return 'failed';
  }

  // STX is pending/undefined — check the underlying EVM status to handle Cancel and Speed Up
  if (evmStatus && smartTransactionEvmFailureStatuses.has(evmStatus)) {
    return 'failed';
  }

  if (evmStatus === EvmTransactionStatus.confirmed) {
    return 'success';
  }

  if (!status || status === SmartTransactionStatuses.PENDING) {
    return 'pending';
  }

  return undefined;
}

// Relies on pendingApprovals being managed via the SmartTransactionHook
export function useSmartTransactionToasts() {
  const dispatch = useDispatch();
  const transactions = useSelector(selectSmartTransactions);
  const previousStatusesRef = useRef<Record<string, ToastStatus | undefined>>(
    {},
  );

  useEffect(() => {
    const nextStatuses: Record<string, ToastStatus | undefined> = {};

    for (const tx of transactions) {
      const toastId = generateToastId(tx.txId);
      const currentStatus = mapSmartTransactionToastStatus(
        tx.smartTransactionStatus,
        tx.evmStatus,
      );
      const previousStatus = previousStatusesRef.current[toastId];

      nextStatuses[toastId] = currentStatus;

      if (previousStatus === undefined && currentStatus === 'pending') {
        showPendingToast(toastId);
        continue;
      }

      if (previousStatus === currentStatus) {
        continue;
      }

      if (currentStatus === 'success') {
        showSuccessToast(toastId);
        dispatch(resolvePendingApproval(tx.approvalId, true));
        continue;
      }

      if (currentStatus === 'failed') {
        showFailedToast(toastId);
        dispatch(resolvePendingApproval(tx.approvalId, true));
      }
    }

    for (const [toastId, previousStatus] of Object.entries(
      previousStatusesRef.current,
    )) {
      // Dismiss pending toasts that are no longer in the transactions list
      if (previousStatus === 'pending' && !(toastId in nextStatuses)) {
        dismissToast(toastId);
      }
    }

    previousStatusesRef.current = nextStatuses;
  }, [dispatch, transactions]);
}
