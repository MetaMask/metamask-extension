import { useEffect } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { EthGasPriceEstimate, GasFeeEstimates, LegacyGasPriceEstimate } from '@metamask/gas-fee-controller';
import { PriorityLevels } from '../../../../shared/constants/gas';
import { gasEstimateGreaterThanGasUsedPlusTenPercent } from '../../../helpers/utils/gas';

export type UseCancelSpeedupInitialGasParams = {
  effectiveTransaction: TransactionMeta;
  gasFeeEstimates: EthGasPriceEstimate | GasFeeEstimates | LegacyGasPriceEstimate | Record<string, never> | null;
  updateTransactionUsingEstimate: (level: string) => void;
  updateTransactionToTenPercentIncreasedGasFee: (
    initTransaction?: boolean,
  ) => void;
  appIsLoading: boolean;
  currentModal: string;
};

const CANCEL_SPEEDUP_MODAL = 'cancelSpeedUpTransaction';

/**
 * Runs the initial gas pick rule when the cancel/speedup modal is open:
 * if medium estimate > (gas used + 10%), use medium; else use tenPercentIncreased.
 * Skips when transaction.previousGas is set, app is loading, or modal is not open.
 * @param options0
 * @param options0.effectiveTransaction
 * @param options0.gasFeeEstimates
 * @param options0.updateTransactionUsingEstimate
 * @param options0.updateTransactionToTenPercentIncreasedGasFee
 * @param options0.appIsLoading
 * @param options0.currentModal
 */
export function useCancelSpeedupInitialGas({
  effectiveTransaction,
  gasFeeEstimates,
  updateTransactionUsingEstimate,
  updateTransactionToTenPercentIncreasedGasFee,
  appIsLoading,
  currentModal,
}: UseCancelSpeedupInitialGasParams): void {
  useEffect(() => {
    if (
      effectiveTransaction.previousGas ||
      appIsLoading ||
      currentModal !== CANCEL_SPEEDUP_MODAL
    ) {
      return;
    }

    const gasUsedLessThanMedium =
      gasFeeEstimates &&
      gasEstimateGreaterThanGasUsedPlusTenPercent(
        effectiveTransaction.txParams,
        gasFeeEstimates,
        PriorityLevels.medium,
      );

    if (gasUsedLessThanMedium) {
      updateTransactionUsingEstimate(PriorityLevels.medium);
      return;
    }
    updateTransactionToTenPercentIncreasedGasFee(true);
  }, [
    effectiveTransaction.previousGas,
    effectiveTransaction.txParams,
    appIsLoading,
    currentModal,
    gasFeeEstimates,
    updateTransactionUsingEstimate,
    updateTransactionToTenPercentIncreasedGasFee,
  ]);
}
