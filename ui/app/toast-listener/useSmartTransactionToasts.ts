import { useEffect, useRef } from 'react';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller';
import { TransactionStatus as EvmTransactionStatus } from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import { type TransactionStatus } from '../../helpers/utils/transaction-display';
import { resolvePendingApproval } from '../../store/actions';
import { selectSmartTransactions } from '../../selectors/toast';
import { showFailedToast, showPendingToast, showSuccessToast } from './shared';

function generateToastId(txId: string) {
  return `stx-${txId}`;
}

const failureStatuses = new Set<string>([
  EvmTransactionStatus.failed,
  EvmTransactionStatus.dropped,
  EvmTransactionStatus.rejected,
  EvmTransactionStatus.cancelled,
]);

function mapToastStatus(
  status?: string,
  evmStatus?: string,
): TransactionStatus | undefined {
  if (status === SmartTransactionStatuses.SUCCESS) {
    return 'success';
  }

  if (
    status === SmartTransactionStatuses.CANCELLED ||
    status === SmartTransactionStatuses.CANCELLED_USER_CANCELLED ||
    status === SmartTransactionStatuses.REVERTED ||
    status === SmartTransactionStatuses.UNKNOWN
  ) {
    return 'failed';
  }

  // STX is pending/undefined — check the underlying EVM status to handle Cancel and Speed Up
  if (evmStatus && failureStatuses.has(evmStatus)) {
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
  const previousStatusesRef = useRef<
    Record<string, TransactionStatus | undefined>
  >({});

  useEffect(() => {
    const nextStatuses: Record<string, TransactionStatus | undefined> = {};

    for (const tx of transactions) {
      const toastId = generateToastId(tx.txId);
      const currentStatus = mapToastStatus(
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

    previousStatusesRef.current = nextStatuses;
  }, [dispatch, transactions]);
}
