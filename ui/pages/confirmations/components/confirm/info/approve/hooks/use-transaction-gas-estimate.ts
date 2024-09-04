import { TransactionMeta } from '@metamask/transaction-controller';
import { useAsyncResult } from '../../../../../../../hooks/useAsyncResult';
import { estimateGas } from '../../../../../../../store/actions';

export const useTransactionGasEstimate = (
  transactionMeta: TransactionMeta,
  customTxParamsData: string,
  customSpendingCap: string,
) => {
  const { value: estimatedGasLimit } = useAsyncResult(async () => {
    return await estimateGas({
      from: transactionMeta.txParams.from,
      to: transactionMeta.txParams.to,
      value: transactionMeta.txParams.value,
      data: customTxParamsData,
    });
  }, [customTxParamsData, customSpendingCap]);

  return { estimatedGasLimit };
};
