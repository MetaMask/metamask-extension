import { useI18nContext } from '../../../hooks/useI18nContext';
import type { TransactionViewModel } from '../../../../shared/lib/multichain/types';
import { TransactionGroupCategory } from '../../../../shared/constants/transaction';

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

  // This should be server-side
  if (transaction.category === TransactionGroupCategory.swap) {
    const fromSymbol = transaction.amounts?.from?.symbol;
    const toSymbol = transaction.amounts?.to?.symbol;

    if (fromSymbol && toSymbol) {
      return t('swapTokenToToken', [fromSymbol, toSymbol]);
    }
  }

  if (transaction.readable) {
    return transaction.readable;
  }

  const key = nonEvmTypeMap[transaction.transactionType];
  return key ? t(key) : '';
}
