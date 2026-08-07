import React from 'react';
import { Link } from 'react-router-dom';
import { toast, ToastContent } from '../../ui/toast/toast';
import { useToastLabel } from './useToastLabel';

export type ToastStatus = 'pending' | 'success' | 'failed';

type Props = {
  toastId?: string;
  transactionId?: string;
  to?: string;
  title?: string;
  description?: string;
  dataTestId?: string;
  actionText?: string;
  onActionClick?: () => void;
};

const TransactionToastContent = ({
  toastId,
  status,
  transactionId,
  title,
  description,
  dataTestId,
  actionText,
  onActionClick,
  to,
}: { status: ToastStatus } & Props) => {
  const { title: derivedTitle, description: derivedDescription } =
    useToastLabel(status, transactionId);

  return (
    <>
      <ToastContent
        title={title ?? derivedTitle}
        description={description ?? derivedDescription}
        dataTestId={dataTestId}
        actionText={actionText}
        onActionClick={onActionClick}
      />

      {to && (
        <Link
          to={to}
          aria-label={title ?? derivedTitle}
          className="absolute inset-0 z-[1] cursor-pointer"
          onClick={() => toast.dismiss(toastId)}
        />
      )}
    </>
  );
};

export function showPendingToast(id: string, props?: Props) {
  toast.loading(
    <TransactionToastContent status="pending" toastId={id} {...props} />,
    { id },
  );
}

export function showSuccessToast(id: string, props?: Props) {
  toast.success(
    <TransactionToastContent status="success" toastId={id} {...props} />,
    { id },
  );
}

export function showFailedToast(id: string, props?: Props) {
  toast.error(
    <TransactionToastContent status="failed" toastId={id} {...props} />,
    {
      id,
    },
  );
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
