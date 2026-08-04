import React from 'react';
import { toast, ToastContent } from '../../ui/toast/toast';
import { useToastLabel } from './useToastLabel';
import { Link } from 'react-router-dom';

export type ToastStatus = 'pending' | 'success' | 'failed';

type Props = {
  transactionId?: string;
  to?: string;
  id?: string;
};

function TxToastContent({
  status,
  transactionId,
  to,
  id,
}: { status: ToastStatus } & Props) {
  const { title, description } = useToastLabel(status, transactionId);

  return (
    <>
      <ToastContent title={title} description={description} />

      {to && (
        <Link
          to={to}
          aria-label={title}
          className="absolute inset-0 z-[1] cursor-pointer"
          onClick={() => toast.dismiss(id)}
        />
      )}
    </>
  );
}

export function showPendingToast(id: string, props?: Props) {
  toast.loading(<TxToastContent status="pending" {...props} />, { id });
}

export function showSuccessToast(id: string, props?: Props) {
  const _props = props?.to ? { ...props, id } : props;
  toast.success(<TxToastContent status="success" {..._props} />, { id });
}

export function showFailedToast(id: string, props?: Props) {
  toast.error(<TxToastContent status="failed" {...props} />, { id });
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
