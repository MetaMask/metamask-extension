import type { TransactionMeta } from '@metamask/transaction-controller';

import { parseStandardTokenTransactionData } from '../../../../../../../shared/modules/transaction.utils';
import { useConfirmContext } from '../../../../context/confirm';

export function useTokenTransactionData() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const transactionData = currentConfirmation?.txParams?.data;

  if (!transactionData) {
    return undefined;
  }

  return parseStandardTokenTransactionData(transactionData);
}
