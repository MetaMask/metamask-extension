import { useSelector } from 'react-redux';

import {
  EDIT_GAS_MODES,
  GAS_ESTIMATE_TYPES,
} from '../../../shared/constants/gas';
import {
  getMaximumGasTotalInHexWei,
  getMinimumGasTotalInHexWei,
} from '../../../shared/modules/gas.utils';

import { PRIMARY, SECONDARY } from '../../helpers/constants/common';
import {
  decGWEIToHexWEI,
  decimalToHex,
} from '../../helpers/utils/conversions.util';
import { getShouldShowFiat } from '../../selectors';

import { useCurrencyDisplay } from '../useCurrencyDisplay';
import { useUserPreferencedCurrency } from '../useUserPreferencedCurrency';

export function useGasEstimates({
  editGasMode,
  gasEstimateType,
  gasFeeEstimates,
  gasLimit,
  gasPrice,
  maxFeePerGas,
  maxFeePerGasFiat,
  maxPriorityFeePerGas,
  minimumGasLimit,
  supportsEIP1559,
}) {
  const {
    currency: fiatCurrency,
    numberOfDecimals: fiatNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY);

  const showFiat = useSelector(getShouldShowFiat);

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY);

  // We have two helper methods that take an object that can have either
  // gasPrice OR the EIP-1559 fields on it, plus gasLimit. This object is
  // conditionally set to the appropriate fields to compute the minimum
  // and maximum cost of a transaction given the current estimates or selected
  // gas fees.
  let gasSettings = {
    gasLimit: decimalToHex(gasLimit),
  };
  if (supportsEIP1559) {
    gasSettings = {
      ...gasSettings,
      maxFeePerGas: decGWEIToHexWEI(maxFeePerGas || gasPrice || '0'),
      maxPriorityFeePerGas: decGWEIToHexWEI(
        maxPriorityFeePerGas || maxFeePerGas || gasPrice || '0',
      ),
      baseFeePerGas: decGWEIToHexWEI(gasFeeEstimates.estimatedBaseFee ?? '0'),
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

  // The maximum amount this transaction will cost
  const maximumCostInHexWei = getMaximumGasTotalInHexWei(gasSettings);

  if (editGasMode === EDIT_GAS_MODES.SWAPS) {
    gasSettings = { ...gasSettings, gasLimit: decimalToHex(minimumGasLimit) };
  }

  // The minimum amount this transaction will cost's
  const minimumCostInHexWei = getMinimumGasTotalInHexWei(gasSettings);

  // We need to display the total amount of native currency will be expended
  // given the selected gas fees.
  const [estimatedMaximumNative] = useCurrencyDisplay(maximumCostInHexWei, {
    numberOfDecimals: primaryNumberOfDecimals,
    currency: primaryCurrency,
  });

  const [estimatedMinimumNative] = useCurrencyDisplay(minimumCostInHexWei, {
    numberOfDecimals: primaryNumberOfDecimals,
    currency: primaryCurrency,
  });

  // We also need to display our closest estimate of the low end of estimation
  // in fiat.
  const [, { value: estimatedMinimumFiat }] = useCurrencyDisplay(
    minimumCostInHexWei,
    {
      numberOfDecimals: fiatNumberOfDecimals,
      currency: fiatCurrency,
    },
  );

  return {
    estimatedMinimumFiat: showFiat ? estimatedMinimumFiat : '',
    estimatedMaximumFiat: showFiat ? maxFeePerGasFiat : '',
    estimatedMaximumNative,
    estimatedMinimumNative,
    estimatedBaseFee: supportsEIP1559
      ? decGWEIToHexWEI(gasFeeEstimates.estimatedBaseFee ?? '0')
      : undefined,
    minimumCostInHexWei,
  };
}
