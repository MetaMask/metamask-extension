import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { checkNetworkAndAccountSupports1559 } from '../../../selectors';
import { isLegacyTransaction } from '../../../helpers/utils/transactions.util';

import { hexWEIToDecGWEI } from '../../../../shared/modules/conversion.utils';
import { feeParamsAreCustom, getGasFeeEstimate } from './utils';

const isNullOrUndefined = (value) => value === null || value === undefined;

const getMaxPriorityFeePerGasFromTransaction = (
  transaction,
  gasFeeEstimates,
) => {
  if (gasFeeEstimates?.[transaction?.userFeeLevel]) {
    return gasFeeEstimates[transaction.userFeeLevel]
      .suggestedMaxPriorityFeePerGas;
  }
  const { maxPriorityFeePerGas, maxFeePerGas, gasPrice } =
    transaction?.txParams || {};
  const feeInHexWei = maxPriorityFeePerGas || maxFeePerGas || gasPrice;
  return feeInHexWei ? Number(hexWEIToDecGWEI(feeInHexWei)) : null;
};

/**
 * @typedef {object} MaxPriorityFeePerGasInputReturnType
 * @property {DecGweiString} [maxPriorityFeePerGas] - the maxPriorityFeePerGas
 *  input value.
 * @property {(DecGweiString) => void} setMaxPriorityFeePerGas - state setter
 *  method to update the maxPriorityFeePerGas.
 */

/**
 * @param options
 * @param options.estimateToUse
 * @param options.gasEstimateType
 * @param options.gasFeeEstimates
 * @param options.transaction
 * @returns {MaxPriorityFeePerGasInputReturnType}
 */
export function useMaxPriorityFeePerGasInput({
  estimateToUse,
  gasEstimateType,
  gasFeeEstimates,
  transaction,
}) {
  const supportsEIP1559 =
    useSelector(checkNetworkAndAccountSupports1559) &&
    !isLegacyTransaction(transaction?.txParams);

  const initialMaxPriorityFeePerGas = supportsEIP1559
    ? getMaxPriorityFeePerGasFromTransaction(transaction, gasFeeEstimates)
    : null;

  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState(() => {
    if (
      !isNullOrUndefined(initialMaxPriorityFeePerGas) &&
      feeParamsAreCustom(transaction)
    ) {
      return initialMaxPriorityFeePerGas;
    }
    return null;
  });

  useEffect(() => {
    if (supportsEIP1559 && !isNullOrUndefined(initialMaxPriorityFeePerGas)) {
      setMaxPriorityFeePerGas(initialMaxPriorityFeePerGas);
    }
  }, [initialMaxPriorityFeePerGas, setMaxPriorityFeePerGas, supportsEIP1559]);

  const maxPriorityFeePerGasToUse =
    maxPriorityFeePerGas ??
    getGasFeeEstimate(
      'suggestedMaxPriorityFeePerGas',
      gasFeeEstimates,
      gasEstimateType,
      estimateToUse,
      initialMaxPriorityFeePerGas || 0,
    );

  return {
    maxPriorityFeePerGas: maxPriorityFeePerGasToUse,
    setMaxPriorityFeePerGas,
  };
}
