import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import { useFeeCalculations } from '../../components/confirm/info/hooks/useFeeCalculations';
import BigNumber from 'bignumber.js';
import { useFiatFormatter } from '../../../../hooks/useFiatFormatter';

export function useEnforcedSimulationsGasCost() {
  const fiatFormatter = useFiatFormatter();

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const originalParams =
    transactionMeta?.txParamsOriginal ?? transactionMeta?.txParams;

  const transactionMetaOriginal = {
    ...transactionMeta,
    txParams: originalParams,
  };

  const originalFees = useFeeCalculations(transactionMetaOriginal);

  const newFees = useFeeCalculations(transactionMeta);

  return fiatFormatter(
    newFees.estimatedFeeFiatUnformatted -
      originalFees.estimatedFeeFiatUnformatted,
  );
}
