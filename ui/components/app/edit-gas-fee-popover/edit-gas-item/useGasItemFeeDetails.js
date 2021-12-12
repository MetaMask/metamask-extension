import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { getMaximumGasTotalInHexWei } from '../../../../../shared/modules/gas.utils';
import {
  EDIT_GAS_MODES,
  PRIORITY_LEVELS,
} from '../../../../../shared/constants/gas';
import {
  decGWEIToHexWEI,
  decimalToHex,
  hexWEIToDecGWEI,
} from '../../../../helpers/utils/conversions.util';
import { gasEstimateGreaterThanGasUsedPlusTenPercent } from '../../../../helpers/utils/gas';
import { getAdvancedGasFeeValues } from '../../../../selectors';
import { useGasFeeContext } from '../../../../contexts/gasFee';
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
  const [estimateGreaterThaGasUse, setEstimateGreaterThaGasUse] = useState(
    false,
  );
  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);
  const { dappSuggestedGasFees } = transaction;

  let maxFeePerGas;
  let maxPriorityFeePerGas;
  let minWaitTime;

  if (gasFeeEstimates?.[priorityLevel]) {
    maxFeePerGas = gasFeeEstimates[priorityLevel].suggestedMaxFeePerGas;
    maxPriorityFeePerGas =
      gasFeeEstimates[priorityLevel].suggestedMaxPriorityFeePerGas;
  } else if (
    priorityLevel === PRIORITY_LEVELS.DAPP_SUGGESTED &&
    dappSuggestedGasFees
  ) {
    maxFeePerGas = hexWEIToDecGWEI(
      dappSuggestedGasFees.maxFeePerGas || dappSuggestedGasFees.gasPrice,
    );
    maxPriorityFeePerGas = hexWEIToDecGWEI(
      dappSuggestedGasFees.maxPriorityFeePerGas || maxFeePerGas,
    );
  } else if (priorityLevel === PRIORITY_LEVELS.CUSTOM) {
    if (estimateUsed === PRIORITY_LEVELS.CUSTOM) {
      maxFeePerGas = maxFeePerGasValue;
      maxPriorityFeePerGas = maxPriorityFeePerGasValue;
    } else if (advancedGasFeeValues) {
      maxFeePerGas =
        gasFeeEstimates.estimatedBaseFee *
        parseFloat(advancedGasFeeValues.maxBaseFee);
      maxPriorityFeePerGas = advancedGasFeeValues.priorityFee;
    }
  } else if (priorityLevel === PRIORITY_LEVELS.MINIMUM) {
    maxFeePerGas = new BigNumber(
      hexWEIToDecGWEI(transaction.previousGas?.maxFeePerGas),
    )
      .times(1.1)
      .toNumber();
    maxPriorityFeePerGas = hexWEIToDecGWEI(
      transaction.previousGas?.maxPriorityFeePerGas,
    );
  }

  const { waitTimeEstimate } = useCustomTimeEstimate({
    gasFeeEstimates,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });

  if (gasFeeEstimates[priorityLevel]) {
    minWaitTime =
      priorityLevel === PRIORITY_LEVELS.HIGH
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
    // For cancel and sepped-up medium / high option is disabled if
    // gas used in transaction + 10% is greater tham estimate
    if (
      (editGasMode === EDIT_GAS_MODES.CANCEL ||
        editGasMode === EDIT_GAS_MODES.SPEED_UP) &&
      (priorityLevel === PRIORITY_LEVELS.MEDIUM ||
        priorityLevel === PRIORITY_LEVELS.HIGH)
    ) {
      const estimateGreater = !gasEstimateGreaterThanGasUsedPlusTenPercent(
        transaction,
        gasFeeEstimates,
        priorityLevel,
      );
      setEstimateGreaterThaGasUse(estimateGreater);
    }
  }, [editGasMode, gasFeeEstimates, priorityLevel, transaction]);

  return {
    estimateGreaterThaGasUse,
    maxFeePerGas,
    maxPriorityFeePerGas,
    minWaitTime,
    hexMaximumTransactionFee,
  };
};
