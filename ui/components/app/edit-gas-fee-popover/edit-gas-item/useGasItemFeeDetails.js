import BigNumber from 'bignumber.js';
import { useSelector } from 'react-redux';

import { getMaximumGasTotalInHexWei } from '../../../../../shared/modules/gas.utils';
import { PRIORITY_LEVELS } from '../../../../../shared/constants/gas';
import {
  decGWEIToHexWEI,
  decimalToHex,
  hexWEIToDecGWEI,
} from '../../../../helpers/utils/conversions.util';
import { getAdvancedGasFeeValues } from '../../../../selectors';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useCustomTimeEstimate } from './useCustomTimeEstimate';

export const useGasItemFeeDetails = (priorityLevel) => {
  const {
    estimateUsed,
    gasFeeEstimates,
    gasLimit,
    maxFeePerGas: maxFeePerGasValue,
    maxPriorityFeePerGas: maxPriorityFeePerGasValue,
    transaction,
  } = useGasFeeContext();
  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);
  const { dappSuggestedGasFees } = transaction;

  let maxFeePerGas;
  let maxPriorityFeePerGas;
  let minWaitTime;

  // todo: extract into separate hook
  if (gasFeeEstimates?.[priorityLevel]) {
    maxFeePerGas = gasFeeEstimates[priorityLevel]?.suggestedMaxFeePerGas;
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
    // todo: review
    // todo: add time estimate
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

  return {
    maxFeePerGas,
    maxPriorityFeePerGas,
    minWaitTime,
    hexMaximumTransactionFee,
  };
};
