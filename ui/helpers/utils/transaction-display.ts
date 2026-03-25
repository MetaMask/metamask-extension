import { useI18nContext } from '../../hooks/useI18nContext';

export type TransactionStatus = 'pending' | 'success' | 'failed';

const TRANSACTION_DISPLAY_KEYS: Record<TransactionStatus, string> = {
  pending: 'transactionSubmitted',
  success: 'transactionConfirmed',
  failed: 'transactionFailed',
};

export function useTransactionDisplayData(status: TransactionStatus) {
  const t = useI18nContext();
  return { title: t(TRANSACTION_DISPLAY_KEYS[status]) };
}
