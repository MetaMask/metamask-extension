import { TransactionMeta } from '@metamask/transaction-controller';

import { useConfirmContext } from '../../../context/confirm';

export function useSwapCheck() {
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const { txParamsOriginal, txParams } = currentConfirmation ?? {
    txParams: { data: '' },
  };
  const { data: txParamsOriginalData } = txParamsOriginal ?? { data: '' };
  const { data: txParamsData } = txParams ?? {};

  return {
    isQuotedSwap:
      (txParamsOriginal && txParamsOriginalData !== txParamsData) ?? false,
  };
}
