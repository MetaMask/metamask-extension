import { useSelector } from 'react-redux';
import { useState } from 'react';

import { addHexPrefix } from 'ethereumjs-util';

import { SECONDARY } from '../../helpers/constants/common';
import { hexWEIToDecGWEI } from '../../helpers/utils/conversions.util';
import { getShouldShowFiat } from '../../selectors';
import { multiplyCurrencies } from '../../../shared/modules/conversion.utils';

import { useCurrencyDisplay } from '../useCurrencyDisplay';
import { useUserPreferencedCurrency } from '../useUserPreferencedCurrency';
import { feeParamsAreCustom, getGasFeeEstimate } from './utils';

export function useMaxPriorityFeePerGasInput({
  estimateToUse,
  gasEstimateType,
  gasFeeEstimates,
  gasLimit,
  supportsEIP1559,
  transaction,
}) {
  const {
    currency: fiatCurrency,
    numberOfDecimals: fiatNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY);

  const showFiat = useSelector(getShouldShowFiat);

  const [initialMaxPriorityFeePerGas] = useState(() => {
    if (!supportsEIP1559) return 0;
    const { maxPriorityFeePerGas, maxFeePerGas, gasPrice } =
      transaction?.txParams || {};
    return Number(
      hexWEIToDecGWEI(maxPriorityFeePerGas || maxFeePerGas || gasPrice),
    );
  });

  const [maxPriorityFeePerGas, setMaxPriorityFeePerGas] = useState(() => {
    if (!initialMaxPriorityFeePerGas || !feeParamsAreCustom(transaction))
      return null;
    return initialMaxPriorityFeePerGas;
  });

  const maxPriorityFeePerGasToUse =
    maxPriorityFeePerGas ??
    getGasFeeEstimate(
      'suggestedMaxPriorityFeePerGas',
      gasFeeEstimates,
      gasEstimateType,
      estimateToUse,
      initialMaxPriorityFeePerGas,
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
