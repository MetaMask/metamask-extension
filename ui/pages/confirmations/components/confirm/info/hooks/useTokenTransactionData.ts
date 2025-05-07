import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../../../context/confirm';
import { parseStandardTokenTransactionData } from '../../../../../../../shared/modules/transaction.utils';

export function useTokenTransactionData() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionData = currentConfirmation?.txParams?.data;

  if (!transactionData) {
    return undefined;
  }

  return parseStandardTokenTransactionData(transactionData);
}
