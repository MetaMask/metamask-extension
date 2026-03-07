/* eslint-disable @typescript-eslint/naming-convention */
import { isHexString } from 'ethereumjs-util';
import {
  GasRecommendations,
  PriorityLevels,
} from '../../../../../shared/constants/gas';
import { MetaMetricsEventTransactionEstimateType } from '../../../../../shared/constants/metametrics';
import { hexWEIToDecGWEI } from '../../../../../shared/modules/conversion.utils';
import { isEIP1559Transaction } from '../../../../../shared/modules/transaction.utils';
import type { TransactionMetricsBuilder } from './types';

export const getGasMetricsProperties: TransactionMetricsBuilder = async ({
  transactionMeta,
  transactionMetricsRequest,
}) => {
  const gasFeeSelected =
    transactionMeta.userFeeLevel === 'dappSuggested'
      ? 'dapp_proposed'
      : transactionMeta.userFeeLevel;

  const gasParams: Record<string, unknown> = {};

  if (isEIP1559Transaction(transactionMeta)) {
    gasParams.max_fee_per_gas = transactionMeta.txParams.maxFeePerGas;
    gasParams.max_priority_fee_per_gas =
      transactionMeta.txParams.maxPriorityFeePerGas;
  } else {
    gasParams.gas_price = transactionMeta.txParams.gasPrice;
    gasParams.default_estimate =
      MetaMetricsEventTransactionEstimateType.DefaultEstimate;
  }

  if (transactionMeta.defaultGasEstimates) {
    const { estimateType } = transactionMeta.defaultGasEstimates;
    if (estimateType) {
      gasParams.default_estimate =
        estimateType === PriorityLevels.dAppSuggested
          ? MetaMetricsEventTransactionEstimateType.DappProposed
          : estimateType;

      if (
        [
          GasRecommendations.low,
          GasRecommendations.medium,
          GasRecommendations.high,
        ].includes(estimateType as GasRecommendations)
      ) {
        const { gasFeeEstimates } =
          await transactionMetricsRequest.getEIP1559GasFeeEstimates();
        if (gasFeeEstimates?.[estimateType]?.suggestedMaxFeePerGas) {
          gasParams.default_max_fee_per_gas =
            gasFeeEstimates[estimateType]?.suggestedMaxFeePerGas;
        }
        if (gasFeeEstimates?.[estimateType]?.suggestedMaxPriorityFeePerGas) {
          gasParams.default_max_priority_fee_per_gas =
            gasFeeEstimates[estimateType]?.suggestedMaxPriorityFeePerGas;
        }
      }
    }

    gasParams.default_gas = transactionMeta.defaultGasEstimates?.gas;
    gasParams.default_gas_price = transactionMeta.defaultGasEstimates?.gasPrice;
  }

  if (transactionMeta.txParams.estimateSuggested) {
    gasParams.estimate_suggested = transactionMeta.txParams.estimateSuggested;
  }
  if (transactionMeta.txParams.estimateUsed) {
    gasParams.estimate_used = transactionMeta.txParams.estimateUsed;
  }
  return {
    properties: {
      gas_fee_selected: gasFeeSelected,
    },
    sensitiveProperties: {
      gas_limit: transactionMeta.txParams.gas,
      ...Object.fromEntries(
        Object.entries(gasParams).map(([key, value]) => [
          key,
          isHexString(value as string)
            ? hexWEIToDecGWEI(value as string)
            : value,
        ]),
      ),
    },
  };
};
