import { useState } from 'react';
import { isEqual } from 'lodash';

import {
  GAS_ESTIMATE_TYPES,
  CUSTOM_GAS_ESTIMATE,
} from '../../../shared/constants/gas';
import { isLegacyTransaction } from '../../helpers/utils/transactions.util';

import { hexWEIToDecGWEI } from '../../../shared/modules/conversion.utils';
import { feeParamsAreCustom } from './utils';

function getGasPriceEstimate(gasFeeEstimates, gasEstimateType, estimateToUse) {
  if (gasEstimateType === GAS_ESTIMATE_TYPES.LEGACY) {
    return gasFeeEstimates?.[estimateToUse] ?? '0';
  } else if (gasEstimateType === GAS_ESTIMATE_TYPES.ETH_GASPRICE) {
    return gasFeeEstimates?.gasPrice ?? '0';
  }
  return '0';
}

/**
 * @typedef {object} GasPriceInputsReturnType
 * @property {DecGweiString} [gasPrice] - the gasPrice input value.
 * @property {(DecGweiString) => void} setGasPrice - state setter method to update the gasPrice.
 * @property {(boolean) => true} setGasPriceHasBeenManuallySet - state setter method to update gasPriceHasBeenManuallySet
 * field gasPriceHasBeenManuallySet is used in gasPrice calculations.
 */

/**
 * @param options
 * @param options.estimateToUse
 * @param options.gasEstimateType
 * @param options.gasFeeEstimates
 * @param options.transaction
 * @returns {GasPriceInputsReturnType}
 */
export function useGasPriceInput({
  estimateToUse,
  gasEstimateType,
  gasFeeEstimates,
  transaction,
}) {
  const [gasPriceHasBeenManuallySet, setGasPriceHasBeenManuallySet] = useState(
    transaction?.userFeeLevel === CUSTOM_GAS_ESTIMATE,
  );

  const [gasPrice, setGasPrice] = useState(() => {
    const { gasPrice: txGasPrice } = transaction?.txParams || {};
    return txGasPrice && feeParamsAreCustom(transaction)
      ? Number(hexWEIToDecGWEI(txGasPrice))
      : null;
  });

  const [initialGasPriceEstimates] = useState(gasFeeEstimates);
  const gasPriceEstimatesHaveNotChanged = isEqual(
    initialGasPriceEstimates,
    gasFeeEstimates,
  );

  const gasPriceToUse =
    gasPrice !== null &&
    (gasPriceHasBeenManuallySet ||
      gasPriceEstimatesHaveNotChanged ||
      isLegacyTransaction(transaction?.txParams))
      ? gasPrice
      : getGasPriceEstimate(gasFeeEstimates, gasEstimateType, estimateToUse);

  return {
    gasPrice: gasPriceToUse,
    setGasPrice,
    setGasPriceHasBeenManuallySet,
  };
}
