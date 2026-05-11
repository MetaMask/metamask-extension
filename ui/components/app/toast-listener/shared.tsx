import React from 'react';
import { toast } from 'react-hot-toast';
import {
  useTransactionDisplay,
  type TransactionStatus,
} from '../../../helpers/utils/transaction-display';
import { ToastContent as ToastContentBase } from '../../ui/toast/toast';

export type ToastStatus = 'pending' | 'success' | 'failed';

export const ToastContent = ({ status }: { status: TransactionStatus }) => {
  const { title } = useTransactionDisplay(status);
  return <ToastContentBase title={title} />;
};

export const CustomToastContent = ({
  title,
  description,
  dataTestId,
}: {
  title: string;
  description?: string;
  dataTestId?: string;
}) => {
  return (
    <ToastContentBase
      title={title}
      description={description}
      dataTestId={dataTestId}
    />
  );
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

export function dismissToast(id: string) {
  toast.dismiss(id);
}

export function showCustomPendingToast(
  id: string,
  props: React.ComponentProps<typeof CustomToastContent>,
) {
  toast.loading(<CustomToastContent {...props} />, { id });
}

export function showCustomSuccessToast(
  id: string,
  props: React.ComponentProps<typeof CustomToastContent>,
) {
  toast.success(<CustomToastContent {...props} />, { id });
}

export function showCustomFailedToast(
  id: string,
  props: React.ComponentProps<typeof CustomToastContent>,
) {
  toast.error(<CustomToastContent {...props} />, { id });
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
