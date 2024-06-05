import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { hexToDecimal } from '../../../../../../../shared/modules/conversion.utils';

export const useEIP1559TxFees = (transactionMeta: TransactionMeta) => {
  const hexMaxFeePerGas = transactionMeta?.txParams?.maxFeePerGas;
  const hexMaxPriorityFeePerGas =
    transactionMeta?.txParams?.maxPriorityFeePerGas;

  return useMemo(() => {
    const maxFeePerGas = hexMaxFeePerGas
      ? Number(hexToDecimal(hexMaxFeePerGas))
      : 0;
    const maxPriorityFeePerGas = hexMaxPriorityFeePerGas
      ? Number(hexToDecimal(hexMaxPriorityFeePerGas))
      : 0;

    return { maxFeePerGas, maxPriorityFeePerGas };
  }, [hexMaxFeePerGas, hexMaxPriorityFeePerGas]);
};
