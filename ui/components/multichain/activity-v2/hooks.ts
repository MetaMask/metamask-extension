import { useI18nContext } from '../../../hooks/useI18nContext';
import type { TransactionViewModel } from '../../../../shared/acme-controller/types';

const nonEvmTypeMap: Record<string, string> = {
  send: 'sent',
  receive: 'received',
  swap: 'swap',
  'stake:deposit': 'stakingDeposit',
  'stake:withdraw': 'stakingWithdrawal',
  unknown: 'interaction',
};

export function useGetTitle(transaction: TransactionViewModel): string {
  const t = useI18nContext();

  if (transaction.readable) {
    return transaction.readable;
  }

  const key = nonEvmTypeMap[transaction.transactionType];
  return key ? t(key) : '';
}
