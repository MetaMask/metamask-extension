import React from 'react';
import { toast } from 'react-hot-toast';
import type { TransactionMeta } from '@metamask/transaction-controller';
import {
  useTransactionDisplay,
  type TransactionStatus,
} from '../../helpers/utils/transaction-display';
import { ToastContent as ToastContentBase } from '../../components/ui/toast/toast';

type EventPayloadArg = TransactionMeta | { transactionMeta?: TransactionMeta };

export function getTransactionFromEvent(
  args: unknown[],
): TransactionMeta | null {
  const firstArg = args?.[0] as EventPayloadArg | undefined;
  if (!firstArg || typeof firstArg !== 'object') {
    return null;
  }

  if ('transactionMeta' in firstArg) {
    return firstArg.transactionMeta ?? null;
  }

  return firstArg as TransactionMeta;
}

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
