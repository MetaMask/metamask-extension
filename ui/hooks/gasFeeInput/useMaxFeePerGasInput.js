import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { GAS_ESTIMATE_TYPES } from '../../../shared/constants/gas';
import { SECONDARY } from '../../helpers/constants/common';
import { getMaximumGasTotalInHexWei } from '../../../shared/modules/gas.utils';
import {
  decGWEIToHexWEI,
  decimalToHex,
  hexWEIToDecGWEI,
} from '../../helpers/utils/conversions.util';
import {
  checkNetworkAndAccountSupports1559,
  getShouldShowFiat,
} from '../../selectors';
import { isLegacyTransaction } from '../../helpers/utils/transactions.util';

import { useCurrencyDisplay } from '../useCurrencyDisplay';
import { useUserPreferencedCurrency } from '../useUserPreferencedCurrency';
import { feeParamsAreCustom, getGasFeeEstimate } from './utils';

const getMaxFeePerGasFromTransaction = (transaction) => {
  const { maxFeePerGas, gasPrice } = transaction?.txParams || {};
  return Number(hexWEIToDecGWEI(maxFeePerGas || gasPrice));
};

/**
 * @typedef {Object} MaxFeePerGasInputReturnType
 * @property {(DecGweiString) => void} setMaxFeePerGas - state setter method to
 *  update the maxFeePerGas.
 * @property {string} [maxFeePerGasFiat] - the maxFeePerGas converted to the
 *  user's preferred currency.
 * @property {(DecGweiString) => void} setMaxFeePerGas - state setter
 *  method to update the setMaxFeePerGas.
 */
export function useMaxFeePerGasInput({
  EIP_1559_V2,
  estimateToUse,
  gasEstimateType,
  gasFeeEstimates,
  gasLimit,
  gasPrice,
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

  const maxFeePerGasFromTransaction = supportsEIP1559
    ? getMaxFeePerGasFromTransaction(transaction)
    : 0;

  // This hook keeps track of a few pieces of transitional state. It is
  // transitional because it is only used to modify a transaction in the
  // metamask (background) state tree.
  const [maxFeePerGas, setMaxFeePerGas] = useState(() => {
    if (maxFeePerGasFromTransaction && feeParamsAreCustom(transaction))
      return maxFeePerGasFromTransaction;
    return null;
  });

  useEffect(() => {
    if (EIP_1559_V2) {
      setMaxFeePerGas(maxFeePerGasFromTransaction);
    }
  }, [EIP_1559_V2, maxFeePerGasFromTransaction, setMaxFeePerGas]);

  let gasSettings = {
    gasLimit: decimalToHex(gasLimit),
  };
  if (supportsEIP1559) {
    gasSettings = {
      ...gasSettings,
      maxFeePerGas: decGWEIToHexWEI(maxFeePerGas || gasPrice || '0'),
    };
  } else if (gasEstimateType === GAS_ESTIMATE_TYPES.NONE) {
    gasSettings = {
      ...gasSettings,
      gasPrice: '0x0',
    };
  } else {
    gasSettings = {
      ...gasSettings,
      gasPrice: decGWEIToHexWEI(gasPrice),
    };
  }

  const maximumCostInHexWei = getMaximumGasTotalInHexWei(gasSettings);

  // We need to display thee estimated fiat currency impact of the maxFeePerGas
  // field to the user. This hook calculates that amount. This also works for
  // the gasPrice amount because in legacy transactions cost is always gasPrice
  // * gasLimit.
  const [, { value: maxFeePerGasFiat }] = useCurrencyDisplay(
    maximumCostInHexWei,
    {
      numberOfDecimals: fiatNumberOfDecimals,
      currency: fiatCurrency,
    },
  );

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
      maxFeePerGasFromTransaction,
    );

  return {
    maxFeePerGas: maxFeePerGasToUse,
    maxFeePerGasFiat: showFiat ? maxFeePerGasFiat : '',
    setMaxFeePerGas,
  };
}
