import { useI18nContext } from '../../hooks/useI18nContext';

export type TransactionStatus = 'pending' | 'success' | 'failed';

const statusMessageKeys: Record<TransactionStatus, string> = {
  pending: 'transactionSubmitted',
  success: 'transactionConfirmed',
  failed: 'transactionFailed',
};

export function useTransactionDisplay(status: TransactionStatus) {
  const t = useI18nContext();
  return { title: t(statusMessageKeys[status]) };
}
