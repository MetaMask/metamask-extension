import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller';
import { TransactionStatus as EvmTransactionStatus } from '@metamask/transaction-controller';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { type TransactionStatus } from '../../../helpers/utils/transaction-display';
import { resolvePendingApproval } from '../../../store/actions';
import { selectSmartTransactions } from '../../../selectors/toast';
import {
  dismissToast,
  showFailedToast,
  showPendingToast,
  showSuccessToast,
} from './shared';
import { useEffect, useRef } from 'react';

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
  const t = useI18nContext();
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
        showPendingToast(toastId, {
          title: t('transactionSubmitted'),
        });
        continue;
      }

      if (previousStatus === currentStatus) {
        continue;
      }

      if (currentStatus === 'success') {
        showSuccessToast(toastId, {
          title: t('transactionConfirmed'),
        });
        dispatch(resolvePendingApproval(tx.approvalId, true));
        continue;
      }

      if (currentStatus === 'failed') {
        showFailedToast(toastId, {
          title: t('transactionFailed'),
        });
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
  }, [dispatch, t, transactions]);
}
