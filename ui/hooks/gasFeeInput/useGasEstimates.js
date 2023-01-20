import { useSelector } from 'react-redux';

import {
  EDIT_GAS_MODES,
  GAS_ESTIMATE_TYPES,
} from '../../../shared/constants/gas';
import {
  getMaximumGasTotalInHexWei,
  getMinimumGasTotalInHexWei,
} from '../../../shared/modules/gas.utils';

import { PRIMARY } from '../../helpers/constants/common';
import { checkNetworkAndAccountSupports1559 } from '../../selectors';
import { isLegacyTransaction } from '../../helpers/utils/transactions.util';

import { useCurrencyDisplay } from '../useCurrencyDisplay';
import { useUserPreferencedCurrency } from '../useUserPreferencedCurrency';
import {
  decGWEIToHexWEI,
  decimalToHex,
} from '../../../shared/modules/conversion.utils';

/**
 * @typedef {object} GasEstimatesReturnType
 * @property {string} [estimatedMinimumNative] - the maximum amount estimated to be paid if the
 *  current network transaction volume increases. Expressed in the network's native currency.
 * @property {HexWeiString} [maximumCostInHexWei] - the maximum amount this transaction will cost.
 * @property {HexWeiString} [minimumCostInHexWei] - the minimum amount this transaction will cost.
 */

/**
 * @param options
 * @param options.editGasMode
 * @param options.gasEstimateType
 * @param options.gasFeeEstimates
 * @param options.gasLimit
 * @param options.gasPrice
 * @param options.maxFeePerGas
 * @param options.maxPriorityFeePerGas
 * @param options.minimumGasLimit
 * @param options.transaction
 * @returns {GasEstimatesReturnType} The gas estimates.
 */
export function useGasEstimates({
  editGasMode,
  gasEstimateType,
  gasFeeEstimates,
  gasLimit,
  gasPrice,
  maxFeePerGas,
  maxPriorityFeePerGas,
  minimumGasLimit,
  transaction,
}) {
  const supportsEIP1559 =
    useSelector(checkNetworkAndAccountSupports1559) &&
    !isLegacyTransaction(transaction?.txParams);

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
  } else {
    gasSettings = {
      ...gasSettings,
      gasPrice:
        gasEstimateType === GAS_ESTIMATE_TYPES.NONE
          ? '0x0'
          : decGWEIToHexWEI(gasPrice),
    };
  }

  // The maximum amount this transaction will cost
  const maximumCostInHexWei = getMaximumGasTotalInHexWei(gasSettings);

  if (editGasMode === EDIT_GAS_MODES.SWAPS) {
    gasSettings = { ...gasSettings, gasLimit: minimumGasLimit };
  }

  // The minimum amount this transaction will cost
  const minimumCostInHexWei = getMinimumGasTotalInHexWei(gasSettings);

  const [estimatedMinimumNative] = useCurrencyDisplay(minimumCostInHexWei, {
    numberOfDecimals: primaryNumberOfDecimals,
    currency: primaryCurrency,
  });

  return {
    estimatedMinimumNative,
    maximumCostInHexWei,
    minimumCostInHexWei,
  };
}
