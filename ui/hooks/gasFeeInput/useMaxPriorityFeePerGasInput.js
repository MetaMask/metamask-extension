import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { addHexPrefix } from 'ethereumjs-util';

import { SECONDARY } from '../../helpers/constants/common';
import { hexWEIToDecGWEI } from '../../helpers/utils/conversions.util';
import {
  checkNetworkAndAccountSupports1559,
  getShouldShowFiat,
} from '../../selectors';
import { multiplyCurrencies } from '../../../shared/modules/conversion.utils';
import { isLegacyTransaction } from '../../helpers/utils/transactions.util';

import { useCurrencyDisplay } from '../useCurrencyDisplay';
import { useUserPreferencedCurrency } from '../useUserPreferencedCurrency';
import { feeParamsAreCustom, getGasFeeEstimate } from './utils';

const getMaxPriorityFeePerGasFromTransaction = (transaction) => {
  const { maxPriorityFeePerGas, maxFeePerGas, gasPrice } =
    transaction?.txParams || {};
  return Number(
    hexWEIToDecGWEI(maxPriorityFeePerGas || maxFeePerGas || gasPrice),
  );
};

/**
 * @typedef {Object} MaxPriorityFeePerGasInputReturnType
 * @property {DecGweiString} [maxPriorityFeePerGas] - the maxPriorityFeePerGas
 *  input value.
 * @property {string} [maxPriorityFeePerGasFiat] - the maxPriorityFeePerGas
 *  converted to the user's preferred currency.
 * @property {(DecGweiString) => void} setMaxPriorityFeePerGas - state setter
 *  method to update the maxPriorityFeePerGas.
 */
export function useMaxPriorityFeePerGasInput({
  EIP_1559_V2,
  estimateToUse,
  gasEstimateType,
  gasFeeEstimates,
  gasLimit,
  transaction,
}) {
  const supportsEIP1559 =
    useSelector(checkNetworkAndAccountSupports1559) &&
    !isLegacyTransaction(transaction?.txParams);

  const {
    currency: fiatCurrency,
    numberOfDecimals: fiatNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY);

  const showFiat = useSelector(getShouldShowFiat);

  const maxPriorityFeePerGasFromTransaction = supportsEIP1559
    ? getMaxPriorityFeePerGasFromTransaction(transaction)
    : 0;

  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState(() => {
    if (maxPriorityFeePerGasFromTransaction && feeParamsAreCustom(transaction))
      return maxPriorityFeePerGasFromTransaction;
    return null;
  });

  useEffect(() => {
    if (EIP_1559_V2) {
      setMaxPriorityFeePerGas(maxPriorityFeePerGasFromTransaction);
    }
  }, [
    EIP_1559_V2,
    maxPriorityFeePerGasFromTransaction,
    setMaxPriorityFeePerGas,
  ]);

  const maxPriorityFeePerGasToUse =
    maxPriorityFeePerGas ??
    getGasFeeEstimate(
      'suggestedMaxPriorityFeePerGas',
      gasFeeEstimates,
      gasEstimateType,
      estimateToUse,
      maxPriorityFeePerGasFromTransaction,
    );

  // We need to display the estimated fiat currency impact of the
  // maxPriorityFeePerGas field to the user. This hook calculates that amount.
  const [, { value: maxPriorityFeePerGasFiat }] = useCurrencyDisplay(
    addHexPrefix(
      multiplyCurrencies(maxPriorityFeePerGasToUse, gasLimit, {
        toNumericBase: 'hex',
        fromDenomination: 'GWEI',
        toDenomination: 'WEI',
        multiplicandBase: 10,
        multiplierBase: 10,
      }),
    ),
    {
      numberOfDecimals: fiatNumberOfDecimals,
      currency: fiatCurrency,
    },
  );

  return {
    maxPriorityFeePerGas: maxPriorityFeePerGasToUse,
    maxPriorityFeePerGasFiat: showFiat ? maxPriorityFeePerGasFiat : '',
    setMaxPriorityFeePerGas,
  };
}
