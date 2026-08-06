import React from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContent as ToastContentBase } from '../../ui/toast/toast';
import { useToastLabel } from './useToastLabel';

export type ToastStatus = 'pending' | 'success' | 'failed';

export type ToastContentOptions = {
  title?: string;
  description?: string;
  dataTestId?: string;
  transactionId?: string;
  actionText?: string;
  onActionClick?: () => void;
  toastId?: string;
  to?: string;
};

export const ToastContent = ({
  status,
  title,
  description,
  dataTestId,
  transactionId,
  actionText,
  onActionClick,
  toastId,
  to,
}: { status: ToastStatus } & ToastContentOptions) => {
  const { title: derivedTitle, description: derivedDescription } =
    useToastLabel(status, transactionId);

  const resolvedTitle = title ?? derivedTitle;

  return (
    <>
      <ToastContentBase
        title={resolvedTitle}
        description={description ?? derivedDescription}
        dataTestId={dataTestId}
        actionText={actionText}
        onActionClick={onActionClick}
      />

      {to && (
        <Link
          to={to}
          aria-label={resolvedTitle}
          className="absolute inset-0 z-[1] cursor-pointer"
          onClick={() => toast.dismiss(toastId)}
        />
      )}
    </>
  );
};

export function showPendingToast(id: string, options?: ToastContentOptions) {
  toast.loading(<ToastContent status="pending" toastId={id} {...options} />, {
    id,
  });
}

export function showSuccessToast(id: string, options?: ToastContentOptions) {
  toast.success(<ToastContent status="success" toastId={id} {...options} />, {
    id,
  });
}

export function showFailedToast(id: string, options?: ToastContentOptions) {
  toast.error(<ToastContent status="failed" toastId={id} {...options} />, {
    id,
  });
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
