import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { checkNetworkAndAccountSupports1559 } from '../../../selectors';
import { isLegacyTransaction } from '../../../helpers/utils/transactions.util';

import { hexWEIToDecGWEI } from '../../../../shared/modules/conversion.utils';
import { feeParamsAreCustom, getGasFeeEstimate } from './utils';

const getMaxFeePerGasFromTransaction = (transaction, gasFeeEstimates) => {
  if (gasFeeEstimates?.[transaction?.userFeeLevel]) {
    return gasFeeEstimates[transaction.userFeeLevel].suggestedMaxFeePerGas;
  }
  const { maxFeePerGas, gasPrice } = transaction?.txParams || {};
  return Number(hexWEIToDecGWEI(maxFeePerGas || gasPrice));
};

/**
 * @typedef {object} MaxFeePerGasInputReturnType
 * @property {(DecGweiString) => void} setMaxFeePerGas - state setter method to update the maxFeePerGas.
 * @property {string} [maxFeePerGas] - getter method for maxFeePerGas.
 */

/**
 * @param options
 * @param options.estimateToUse
 * @param options.gasEstimateType
 * @param options.gasFeeEstimates
 * @param options.transaction
 * @returns {MaxFeePerGasInputReturnType}
 */
export function useMaxFeePerGasInput({
  estimateToUse,
  gasEstimateType,
  gasFeeEstimates,
  transaction,
}) {
  const supportsEIP1559 =
    useSelector(checkNetworkAndAccountSupports1559) &&
    !isLegacyTransaction(transaction?.txParams);

  const initialMaxFeePerGas = supportsEIP1559
    ? getMaxFeePerGasFromTransaction(transaction, gasFeeEstimates)
    : 0;

  // This hook keeps track of a few pieces of transitional state. It is
  // transitional because it is only used to modify a transaction in the
  // metamask (background) state tree.
  const [maxFeePerGas, setMaxFeePerGas] = useState(() => {
    if (initialMaxFeePerGas && feeParamsAreCustom(transaction)) {
      return initialMaxFeePerGas;
    }
    return null;
  });

  useEffect(() => {
    if (supportsEIP1559 && initialMaxFeePerGas) {
      setMaxFeePerGas(initialMaxFeePerGas);
    }
  }, [initialMaxFeePerGas, setMaxFeePerGas, supportsEIP1559]);

  // We specify whether to use the estimate value by checking if the state
  // value has been set. The state value is only set by user input and is wiped
  // when the user selects an estimate. Default here is '0' to avoid bignumber
  // errors in later calculations for nullish values.
  const maxFeePerGasToUse =
    maxFeePerGas ??
    getGasFeeEstimate(
      'suggestedMaxFeePerGas',
      gasFeeEstimates,
      gasEstimateType,
      estimateToUse,
      initialMaxFeePerGas || 0,
    );

  return {
    maxFeePerGas: maxFeePerGasToUse,
    setMaxFeePerGas,
  };
}
