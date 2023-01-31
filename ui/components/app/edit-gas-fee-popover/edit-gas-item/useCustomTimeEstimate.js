import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';

import { GasEstimateTypes } from '../../../../../shared/constants/gas';
import {
  getGasEstimateType,
  getIsGasEstimatesLoading,
} from '../../../../ducks/metamask/metamask';
import { getGasFeeTimeEstimate } from '../../../../store/actions';

export const useCustomTimeEstimate = ({
  gasFeeEstimates,
  maxFeePerGas,
  maxPriorityFeePerGas,
}) => {
  const gasEstimateType = useSelector(getGasEstimateType);
  const isGasEstimatesLoading = useSelector(getIsGasEstimatesLoading);

  const [customEstimatedTime, setCustomEstimatedTime] = useState(null);

  const returnNoEstimates =
    isGasEstimatesLoading ||
    gasEstimateType !== GasEstimateTypes.feeMarket ||
    !maxPriorityFeePerGas;

  // If the user has chosen a value lower than the low gas fee estimate,
  // We'll need to use the useEffect hook below to make a call to calculate
  // the time to show
  const isUnknownLow =
    gasFeeEstimates?.low &&
    Number(maxPriorityFeePerGas) <
      Number(gasFeeEstimates.low.suggestedMaxPriorityFeePerGas);

  useEffect(() => {
    if (
      isGasEstimatesLoading ||
      gasEstimateType !== GasEstimateTypes.feeMarket ||
      !maxPriorityFeePerGas
    ) {
      return;
    }
    if (isUnknownLow) {
      // getGasFeeTimeEstimate requires parameters in string format
      getGasFeeTimeEstimate(
        new BigNumber(maxPriorityFeePerGas, 10).toString(10),
        new BigNumber(maxFeePerGas, 10).toString(10),
      ).then((result) => {
        setCustomEstimatedTime(result);
      });
    }
  }, [
    gasEstimateType,
    isUnknownLow,
    isGasEstimatesLoading,
    maxFeePerGas,
    maxPriorityFeePerGas,
    returnNoEstimates,
  ]);

  if (returnNoEstimates) {
    return {};
  }

  const { low = {}, medium = {}, high = {} } = gasFeeEstimates;
  let waitTimeEstimate = '';

  if (
    isUnknownLow &&
    customEstimatedTime &&
    customEstimatedTime !== 'unknown' &&
    customEstimatedTime?.upperTimeBound !== 'unknown'
  ) {
    waitTimeEstimate = Number(customEstimatedTime?.upperTimeBound);
  } else if (
    Number(maxPriorityFeePerGas) >= Number(medium.suggestedMaxPriorityFeePerGas)
  ) {
    waitTimeEstimate = high.minWaitTimeEstimate;
  } else {
    waitTimeEstimate = low.maxWaitTimeEstimate;
  }

  return { waitTimeEstimate };
};
