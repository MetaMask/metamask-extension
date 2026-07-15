import React from 'react';
import { toast, ToastContent as ToastContentBase } from '../../ui/toast/toast';
import { useToastLabel } from './useToastLabel';

export type ToastStatus = 'pending' | 'success' | 'failed';

type ToastContentOptions = {
  title?: string;
  description?: string;
  dataTestId?: string;
  transactionId?: string;
};

export const ToastContent = ({
  status,
  title,
  description,
  dataTestId,
  transactionId,
}: { status: ToastStatus } & ToastContentOptions) => {
  const { title: derivedTitle, description: derivedDescription } =
    useToastLabel(status, transactionId);

  return (
    <ToastContentBase
      title={title ?? derivedTitle}
      description={description ?? derivedDescription}
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
