import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { hexToDecimal } from '../../../../../../../shared/modules/conversion.utils';
import { DecimalNumberString } from '../shared/types';

export const useEIP1559TxFees = (
  transactionMeta: TransactionMeta,
): {
  maxFeePerGas: DecimalNumberString;
  maxPriorityFeePerGas: DecimalNumberString;
} => {
  const hexMaxFeePerGas = transactionMeta?.txParams?.maxFeePerGas;
  const hexMaxPriorityFeePerGas =
    transactionMeta?.txParams?.maxPriorityFeePerGas;

  return useMemo(() => {
    const maxFeePerGas = hexMaxFeePerGas ? hexToDecimal(hexMaxFeePerGas) : '0';
    const maxPriorityFeePerGas = hexMaxPriorityFeePerGas
      ? hexToDecimal(hexMaxPriorityFeePerGas)
      : '0';

    return { maxFeePerGas, maxPriorityFeePerGas };
  }, [hexMaxFeePerGas, hexMaxPriorityFeePerGas]);
};
