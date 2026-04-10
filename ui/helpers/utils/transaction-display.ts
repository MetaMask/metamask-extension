import { TransactionType } from '@metamask/transaction-controller';
import { useI18nContext } from '../../hooks/useI18nContext';
import type { ToastTransactionContext } from '../../components/ui/toast/types';

type ToastMessageKeys = {
  pending: string;
  success: string;
  failed: string;
};

const fallbackKeys: Record<ToastTransactionContext['status'], string> = {
  pending: 'transactionSubmitted',
  success: 'transactionConfirmed',
  failed: 'transactionFailed',
};

const toastMessageMap: Partial<Record<TransactionType, ToastMessageKeys>> = {
  [TransactionType.simpleSend]: {
    pending: 'toastSendPending',
    success: 'toastSendConfirmed',
    failed: 'toastSendFailed',
  },
  [TransactionType.swap]: {
    pending: 'toastSwapPending',
    success: 'toastSwapConfirmed',
    failed: 'toastSwapFailed',
  },
};

export function useTransactionDisplay(context: ToastTransactionContext): {
  title: string;
} {
  const t = useI18nContext();
  const config = toastMessageMap[context.transactionType as TransactionType];
  if (config) {
    return { title: t(config[context.status], context.params) };
  }
  return { title: t(fallbackKeys[context.status]) };
}
