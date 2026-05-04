import React from 'react';
import { toast } from 'react-hot-toast';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  useTransactionDisplay,
  type TransactionStatus,
} from '../../helpers/utils/transaction-display';
import { ToastContent as ToastContentBase } from '../../components/ui/toast/toast';

export type ToastStatus = 'pending' | 'success' | 'failed';

export const ToastContent = ({ status }: { status: TransactionStatus }) => {
  const { title } = useTransactionDisplay(status);
  return <ToastContentBase title={title} />;
};

export function showPendingToast(id: string) {
  toast.loading(<ToastContent status="pending" />, { id });
}

export function showSuccessToast(id: string) {
  toast.success(<ToastContent status="success" />, { id });
}

export function showFailedToast(id: string) {
  toast.error(<ToastContent status="failed" />, { id });
}

export function showToast(id: string, status: ToastStatus) {
  if (status === 'pending') {
    showPendingToast(id);
  } else if (status === 'success') {
    showSuccessToast(id);
  } else if (status === 'failed') {
    showFailedToast(id);
  }
}
