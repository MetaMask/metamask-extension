import React from 'react';
import { toast } from 'react-hot-toast';
import {
  useTransactionDisplay,
  type TransactionStatus,
} from '../../../helpers/utils/transaction-display';
import { ToastContent as ToastContentBase } from '../../ui/toast/toast';

export type ToastStatus = 'pending' | 'success' | 'failed';

type ToastContentOptions = {
  title?: string;
  description?: string;
  dataTestId?: string;
};

export const ToastContent = ({
  status,
  title,
  description,
  dataTestId,
}: { status: TransactionStatus } & ToastContentOptions) => {
  const { title: statusTitle } = useTransactionDisplay(status);

  return (
    <ToastContentBase
      title={title ?? statusTitle}
      description={description}
      dataTestId={dataTestId}
    />
  );
};

export function showPendingToast(id: string, options?: ToastContentOptions) {
  toast.loading(<ToastContent status="pending" {...options} />, { id });
}

export function showSuccessToast(id: string, options?: ToastContentOptions) {
  toast.success(<ToastContent status="success" {...options} />, { id });
}

export function showFailedToast(id: string, options?: ToastContentOptions) {
  toast.error(<ToastContent status="failed" {...options} />, { id });
}

export function dismissToast(id: string) {
  toast.dismiss(id);
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
