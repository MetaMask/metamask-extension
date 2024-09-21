import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  EditGasModes,
  PriorityLevels,
} from '../../../../../../shared/constants/gas';
import { getMaximumGasTotalInHexWei } from '../../../../../../shared/modules/gas.utils';
import {
  addTenPercentAndRound,
  gasEstimateGreaterThanGasUsedPlusTenPercent,
} from '../../../../../helpers/utils/gas';
import { getAdvancedGasFeeValues } from '../../../../../selectors';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import {
  decGWEIToHexWEI,
  decimalToHex,
  hexWEIToDecGWEI,
} from '../../../../../../shared/modules/conversion.utils';
import { useCustomTimeEstimate } from './useCustomTimeEstimate';

export const useGasItemFeeDetails = (priorityLevel) => {
  const {
    editGasMode,
    estimateUsed,
    gasFeeEstimates,
    gasLimit,
    maxFeePerGas: maxFeePerGasValue,
    maxPriorityFeePerGas: maxPriorityFeePerGasValue,
    transaction,
  } = useGasFeeContext();
  const [estimateGreaterThanGasUse, setEstimateGreaterThanGasUse] =
    useState(false);
  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);

  let maxFeePerGas;
  let maxPriorityFeePerGas;
  let minWaitTime;

  const { dappSuggestedGasFees } = transaction;

  if (gasFeeEstimates?.[priorityLevel]) {
    maxFeePerGas = gasFeeEstimates[priorityLevel].suggestedMaxFeePerGas;
    maxPriorityFeePerGas =
      gasFeeEstimates[priorityLevel].suggestedMaxPriorityFeePerGas;
  } else if (
    priorityLevel === PriorityLevels.dAppSuggested &&
    dappSuggestedGasFees
  ) {
    maxFeePerGas = hexWEIToDecGWEI(
      dappSuggestedGasFees.maxFeePerGas || dappSuggestedGasFees.gasPrice,
    );
    maxPriorityFeePerGas = hexWEIToDecGWEI(
      dappSuggestedGasFees.maxPriorityFeePerGas || maxFeePerGas,
    );
  } else if (priorityLevel === PriorityLevels.custom) {
    if (estimateUsed === PriorityLevels.custom) {
      maxFeePerGas = maxFeePerGasValue;
      maxPriorityFeePerGas = maxPriorityFeePerGasValue;
    } else if (advancedGasFeeValues && editGasMode !== EditGasModes.swaps) {
      maxFeePerGas = advancedGasFeeValues.maxBaseFee;
      maxPriorityFeePerGas = advancedGasFeeValues.priorityFee;
    }
  } else if (
    priorityLevel === PriorityLevels.tenPercentIncreased &&
    transaction.previousGas
  ) {
    maxFeePerGas = hexWEIToDecGWEI(
      addTenPercentAndRound(transaction.previousGas?.maxFeePerGas),
    );
    maxPriorityFeePerGas = hexWEIToDecGWEI(
      addTenPercentAndRound(transaction.previousGas?.maxPriorityFeePerGas),
    );
  }

  const { waitTimeEstimate } = useCustomTimeEstimate({
    gasFeeEstimates,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });

  if (gasFeeEstimates?.[priorityLevel]) {
    minWaitTime =
      priorityLevel === PriorityLevels.high
        ? gasFeeEstimates?.high.minWaitTimeEstimate
        : gasFeeEstimates?.low.maxWaitTimeEstimate;
  } else {
    minWaitTime = waitTimeEstimate;
  }

  const hexMaximumTransactionFee = maxFeePerGas
    ? getMaximumGasTotalInHexWei({
        gasLimit: decimalToHex(gasLimit),
        maxFeePerGas: decGWEIToHexWEI(maxFeePerGas),
      })
    : null;

  useEffect(() => {
    // For cancel and speed-up medium / high option is disabled if
    // gas used in transaction + 10% is greater tham estimate
    if (
      (editGasMode === EditGasModes.cancel ||
        editGasMode === EditGasModes.speedUp) &&
      (priorityLevel === PriorityLevels.medium ||
        priorityLevel === PriorityLevels.high)
    ) {
      const estimateGreater = !gasEstimateGreaterThanGasUsedPlusTenPercent(
        transaction.previousGas || transaction.txParams,
        gasFeeEstimates,
        priorityLevel,
      );
      setEstimateGreaterThanGasUse(estimateGreater);
    }
  }, [editGasMode, gasFeeEstimates, priorityLevel, transaction]);

  return {
    estimateGreaterThanGasUse,
    maxFeePerGas,
    maxPriorityFeePerGas,
    minWaitTime,
    hexMaximumTransactionFee,
  };
};
