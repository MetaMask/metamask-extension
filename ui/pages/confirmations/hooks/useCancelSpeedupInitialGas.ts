import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  EthGasPriceEstimate,
  GasFeeEstimates,
  LegacyGasPriceEstimate,
} from '@metamask/gas-fee-controller';
import { PriorityLevels } from '../../../../shared/constants/gas';
import { gasEstimateGreaterThanGasUsedPlusTenPercent } from '../../../helpers/utils/gas';
import { updatePreviousGasParams } from '../../../store/actions';

export type UseCancelSpeedupInitialGasParams = {
  effectiveTransaction: TransactionMeta;
  gasFeeEstimates:
    | EthGasPriceEstimate
    | GasFeeEstimates
    | LegacyGasPriceEstimate
    | Record<string, never>
    | null;
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
 * Persists original gas as previousGas when modal opens so replacement txs use at least original × rate.
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
  const appliedInitialGasForTransactionIdRef = useRef<string | null>(null);
  const storedPreviousGasForTransactionIdRef = useRef<string | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    if (currentModal !== CANCEL_SPEEDUP_MODAL) {
      appliedInitialGasForTransactionIdRef.current = null;
      return;
    }

    if (effectiveTransaction.previousGas || appIsLoading) {
      return;
    }

    const { txParams } = effectiveTransaction;
    const hasEIP1559Gas =
      txParams?.maxFeePerGas &&
      txParams?.maxPriorityFeePerGas &&
      (txParams?.gasLimit || txParams?.gas);

    if (
      hasEIP1559Gas &&
      storedPreviousGasForTransactionIdRef.current !== effectiveTransaction.id
    ) {
      dispatch(
        updatePreviousGasParams(effectiveTransaction.id, {
          maxFeePerGas: txParams.maxFeePerGas,
          maxPriorityFeePerGas: txParams.maxPriorityFeePerGas,
          gasLimit: txParams.gasLimit ?? txParams.gas,
        }),
      );
      storedPreviousGasForTransactionIdRef.current = effectiveTransaction.id;
    }

    if (
      appliedInitialGasForTransactionIdRef.current === effectiveTransaction.id
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
    } else {
      updateTransactionToTenPercentIncreasedGasFee();
    }
    appliedInitialGasForTransactionIdRef.current = effectiveTransaction.id;
  }, [
    effectiveTransaction.id,
    effectiveTransaction.previousGas,
    effectiveTransaction.txParams,
    appIsLoading,
    currentModal,
    gasFeeEstimates,
    updateTransactionUsingEstimate,
    updateTransactionToTenPercentIncreasedGasFee,
  ]);
}
