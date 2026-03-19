import { useTransactionMetadataRequest } from '../../../../hooks/useTransactionMetadataRequest';
import { parseStandardTokenTransactionData } from '../../../../../../../shared/lib/transaction.utils';

export function useTokenTransactionData() {
  const currentConfirmation = useTransactionMetadataRequest();
  const transactionData = currentConfirmation?.txParams?.data;

  if (!transactionData) {
    return undefined;
  }

  return parseStandardTokenTransactionData(transactionData);
}
