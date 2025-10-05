import { parseStandardTokenTransactionData } from '../../../../../../../shared/modules/transaction.utils';
import { useUnapprovedTransactionWithFallback } from '../../../../hooks/transactions/useUnapprovedTransaction';

export function useTokenTransactionData() {
  const transactionMeta = useUnapprovedTransactionWithFallback();
  const transactionData = transactionMeta.txParams.data;

  if (!transactionData) {
    return undefined;
  }

  return parseStandardTokenTransactionData(transactionData);
}
