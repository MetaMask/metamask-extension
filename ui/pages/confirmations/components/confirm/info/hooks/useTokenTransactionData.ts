import { parseStandardTokenTransactionData } from '../../../../../../../shared/modules/transaction.utils';
import { useTransactionData } from '../../../../hooks/transactions/useUnapprovedTransaction';

export function useTokenTransactionData() {
  const transactionData = useTransactionData();

  if (!transactionData) {
    return undefined;
  }

  return parseStandardTokenTransactionData(transactionData);
}
