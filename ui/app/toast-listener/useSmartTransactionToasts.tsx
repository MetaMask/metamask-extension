import React, { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { SmartTransactionStatuses } from '@metamask/smart-transactions-controller';
import { useSelector } from 'react-redux';
import { ToastContent as ToastContentBase } from '../../components/ui/toast/toast';
import {
  type TransactionStatus,
  useTransactionDisplay,
} from '../../helpers/utils/transaction-display';
import {
  selectExperimentalEvmOriginToastStates,
  type ExperimentalEvmOriginToastState,
} from '../../selectors/toast';

type ToastStatus = 'pending' | 'success' | 'failed' | undefined;

function generateToastId(txId: string) {
  return `exp-evm-origin-${txId}`;
}

const ToastContent = ({ status }: { status: TransactionStatus }) => {
  const { title } = useTransactionDisplay(status);
  return <ToastContentBase title={`[EVM Origin] ${title}`} />;
};

function showPendingToast(id: string) {
  toast.loading(<ToastContent status="pending" />, { id });
}

function showSuccessToast(id: string) {
  toast.success(<ToastContent status="success" />, { id });
}

function showFailedToast(id: string) {
  toast.error(<ToastContent status="failed" />, { id });
}

function mapToastStatus(status?: string): ToastStatus {
  if (!status || status === SmartTransactionStatuses.PENDING) {
    return 'pending';
  }

  if (status === SmartTransactionStatuses.SUCCESS) {
    return 'success';
  }

  if (
    status === SmartTransactionStatuses.CANCELLED ||
    status === SmartTransactionStatuses.CANCELLED_USER_CANCELLED ||
    status === SmartTransactionStatuses.REVERTED
  ) {
    return 'failed';
  }
}

export function useSmartTransactionToasts() {
  const toastStates =
    (useSelector(selectExperimentalEvmOriginToastStates) as
      | ExperimentalEvmOriginToastState[]
      | undefined) ?? [];

  const previousStatusesRef = useRef<Record<string, ToastStatus>>({});

  useEffect(() => {
    const nextStatuses: Record<string, ToastStatus> = {};

    for (const toastState of toastStates) {
      const toastId = generateToastId(toastState.txId);
      const currentStatus = mapToastStatus(toastState.smartTransactionStatus);
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
        continue;
      }

      if (currentStatus === 'failed') {
        showFailedToast(toastId);
      }
    }

    previousStatusesRef.current = nextStatuses;
  }, [toastStates]);
}
