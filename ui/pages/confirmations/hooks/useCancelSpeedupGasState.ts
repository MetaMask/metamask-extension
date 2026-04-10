import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  EthGasPriceEstimate,
  GasFeeEstimates,
  LegacyGasPriceEstimate,
} from '@metamask/gas-fee-controller';
import {
  EditGasModes,
  GasRecommendations,
} from '../../../../shared/constants/gas';
import { selectTransactionMetadata } from '../../../selectors';
import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import {
  hexToDecimal,
  hexWEIToDecGWEI,
} from '../../../../shared/lib/conversion.utils';
import { useSupportsEIP1559 } from '../components/confirm/info/hooks/useSupportsEIP1559';
import { useTransactionFunctions } from './useTransactionFunctions';
import { useLegacyCancelSpeedupFlow } from './useLegacyCancelSpeedupFlow';

export type UseCancelSpeedupGasStateReturn = {
  effectiveTransaction: TransactionMeta;
  gasFeeEstimates:
    | EthGasPriceEstimate
    | GasFeeEstimates
    | LegacyGasPriceEstimate
    | Record<string, never>
    | null;
  isGasEstimatesLoading: boolean;
  cancelTransaction: () => void;
  speedUpTransaction: () => void;
  updateTransactionToTenPercentIncreasedGasFee: (
    initTransaction?: boolean,
  ) => void;
  updateTransactionUsingEstimate: (gasFeeEstimateToUse: string) => void;
};

/**
 * Provides effective transaction state and action functions for the cancel/speedup flow.
 * Routes to the legacy (gasPrice) or EIP-1559 (maxFeePerGas) flow based on
 * whether the transaction has EIP-1559 gas parameters.
 * @param transaction
 * @param editGasMode
 */
export function useCancelSpeedupGasState(
  transaction: TransactionMeta,
  editGasMode: EditGasModes,
): UseCancelSpeedupGasStateReturn {
  const transactionFromStore = useSelector((state: Record<string, unknown>) =>
    selectTransactionMetadata(state, transaction?.id),
  );

  const effectiveTransaction = useMemo(() => {
    return transactionFromStore ?? transaction;
  }, [transactionFromStore, transaction]);

  const { gasFeeEstimates, isGasEstimatesLoading } = useGasFeeEstimates(
    effectiveTransaction.networkClientId,
  );

  const { supportsEIP1559 } = useSupportsEIP1559(
    effectiveTransaction as TransactionMeta,
  );
  const isLegacy = !supportsEIP1559;

  // EIP-1559 flow
  const gasLimitNum = Number(
    hexToDecimal(
      effectiveTransaction?.txParams?.gasLimit ??
        effectiveTransaction?.txParams?.gas ??
        '0x0',
    ),
  );

  const maxPriorityFeePerGasGwei = effectiveTransaction?.txParams
    ?.maxPriorityFeePerGas
    ? hexWEIToDecGWEI(effectiveTransaction.txParams.maxPriorityFeePerGas)
    : '0';

  const eip1559Functions = useTransactionFunctions({
    defaultEstimateToUse: GasRecommendations.medium,
    editGasMode,
    estimatedBaseFee: (gasFeeEstimates as GasFeeEstimates)?.estimatedBaseFee,
    gasFeeEstimates,
    gasLimit: gasLimitNum,
    maxPriorityFeePerGas: maxPriorityFeePerGasGwei,
    transaction: effectiveTransaction as TransactionMeta,
  });

  // Legacy flow
  const legacyFunctions = useLegacyCancelSpeedupFlow({
    transaction: effectiveTransaction as TransactionMeta,
    gasFeeEstimates,
  });

  const {
    cancelTransaction,
    speedUpTransaction,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingEstimate,
  } = isLegacy ? legacyFunctions : eip1559Functions;

  return {
    effectiveTransaction: effectiveTransaction as TransactionMeta,
    gasFeeEstimates: gasFeeEstimates ?? null,
    isGasEstimatesLoading,
    cancelTransaction,
    speedUpTransaction,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingEstimate,
  };
}
