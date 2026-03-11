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
import {
  selectNetworkConfigurationByChainId,
  selectTransactionMetadata,
} from '../../../selectors';
import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import {
  hexToDecimal,
  hexWEIToDecGWEI,
} from '../../../../shared/modules/conversion.utils';
import { useTransactionFunctions } from './useTransactionFunctions';

export type UseCancelSpeedupGasStateReturn = {
  effectiveTransaction: TransactionMeta;
  gasFeeEstimates:
    | EthGasPriceEstimate
    | GasFeeEstimates
    | LegacyGasPriceEstimate
    | Record<string, never>
    | null;
  cancelTransaction: () => void;
  speedUpTransaction: () => void;
  updateTransactionToTenPercentIncreasedGasFee: (
    initTransaction?: boolean,
  ) => void;
  updateTransactionUsingEstimate: (gasFeeEstimateToUse: string) => void;
};

/**
 * Provides effective transaction state and action functions for the cancel/speedup flow.
 * Effective transaction comes from the store (after gas updates) or the prop.
 * Gas updates dispatch to the store so no local retry state is needed.
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

  const network = useSelector((state: Record<string, unknown>) =>
    selectNetworkConfigurationByChainId(state, transaction?.chainId),
  );

  const networkClientId = (
    network as {
      rpcEndpoints?: { networkClientId?: string }[];
      defaultRpcEndpointIndex?: number;
    }
  )?.rpcEndpoints?.[
    (network as { defaultRpcEndpointIndex?: number })
      ?.defaultRpcEndpointIndex ?? 0
  ]?.networkClientId;

  const effectiveTransaction = useMemo(() => {
    const sourceTx = transactionFromStore ?? transaction;
    return {
      ...sourceTx,
      networkClientId:
        (sourceTx as TransactionMeta & { networkClientId?: string })
          .networkClientId ?? networkClientId,
    };
  }, [transactionFromStore, transaction, networkClientId]);

  const { gasFeeEstimates } = useGasFeeEstimates(networkClientId);

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

  const {
    cancelTransaction,
    speedUpTransaction,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingEstimate,
  } = useTransactionFunctions({
    defaultEstimateToUse: GasRecommendations.medium,
    editGasMode,
    estimatedBaseFee: (gasFeeEstimates as GasFeeEstimates)?.estimatedBaseFee,
    gasFeeEstimates: gasFeeEstimates ?? undefined,
    gasLimit: gasLimitNum,
    maxPriorityFeePerGas: maxPriorityFeePerGasGwei,
    transaction: effectiveTransaction as TransactionMeta,
  });

  return {
    effectiveTransaction: effectiveTransaction as TransactionMeta,
    gasFeeEstimates: gasFeeEstimates ?? null,
    cancelTransaction,
    speedUpTransaction,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingEstimate,
  };
}
