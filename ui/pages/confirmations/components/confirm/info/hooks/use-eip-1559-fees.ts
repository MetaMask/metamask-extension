import { TransactionMeta } from '@metamask/transaction-controller';
import { useEffect, useState } from 'react';
import { hexToDecimal } from '../../../../../../../shared/modules/conversion.utils';

export const useEIP1559TxFees = (currentConfirmation: TransactionMeta) => {
  const [maxFeePerGas, setMaxFeePerGas] = useState(0);
  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState(0);

  useEffect(() => {
    const newMaxFeePerGas = currentConfirmation?.txParams?.maxFeePerGas
      ? Number(hexToDecimal(currentConfirmation.txParams.maxFeePerGas))
      : 0;

    const newMaxPriorityFeePerGas = currentConfirmation?.txParams
      ?.maxPriorityFeePerGas
      ? Number(hexToDecimal(currentConfirmation.txParams.maxPriorityFeePerGas))
      : 0;

    setMaxFeePerGas(newMaxFeePerGas);
    setMaxPriorityFeePerGas(newMaxPriorityFeePerGas);
  }, [currentConfirmation]);

  return { maxFeePerGas, maxPriorityFeePerGas };
};
