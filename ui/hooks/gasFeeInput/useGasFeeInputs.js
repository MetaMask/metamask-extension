import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  checkNetworkAndAccountSupports1559,
  getAdvancedInlineGasShown,
} from '../../selectors';
import { hexToDecimal } from '../../helpers/utils/conversions.util';
import { GAS_FORM_ERRORS } from '../../helpers/constants/gas';
import { isLegacyTransaction } from '../../helpers/utils/transactions.util';
import { useGasFeeEstimates } from '../useGasFeeEstimates';

import { useGasFeeErrors } from './useGasFeeErrors';
import { useGasPriceInputs } from './useGasPriceInputs';
import { useMaxFeePerGasInput } from './useMaxFeePerGasInput';
import { useMaxPriorityFeePerGasInput } from './useMaxPriorityFeePerGasInput';
import { useGasEstimates } from './useGasEstimates';

/**
 * @typedef {Object} GasFeeInputReturnType
 * @property {DecGweiString} [maxFeePerGas] - the maxFeePerGas input value.
 * @property {string} [maxFeePerGasFiat] - the maxFeePerGas converted to the
 *  user's preferred currency.
 * @property {(DecGweiString) => void} setMaxFeePerGas - state setter method to
 *  update the maxFeePerGas.
 * @property {DecGweiString} [maxPriorityFeePerGas] - the maxPriorityFeePerGas
 *  input value.
 * @property {string} [maxPriorityFeePerGasFiat] - the maxPriorityFeePerGas
 *  converted to the user's preferred currency.
 * @property {(DecGweiString) => void} setMaxPriorityFeePerGas - state setter
 *  method to update the maxPriorityFeePerGas.
 * @property {DecGweiString} [gasPrice] - the gasPrice input value.
 * @property {(DecGweiString) => void} setGasPrice - state setter method to
 *  update the gasPrice.
 * @property {DecGweiString} gasLimit - the gasLimit input value.
 * @property {(DecGweiString) => void} setGasLimit - state setter method to
 *  update the gasLimit.
 * @property {EstimateLevel} [estimateToUse] - the estimate level currently
 *  selected. This will be null if the user has ejected from using the
 *  estimates.
 * @property {([EstimateLevel]) => void} setEstimateToUse - Setter method for
 *  choosing which EstimateLevel to use.
 * @property {string} [estimatedMinimumFiat] - The amount estimated to be paid
 *  based on current network conditions. Expressed in user's preferred
 *  currency.
 * @property {string} [estimatedMaximumFiat] - the maximum amount estimated to be
 *  paid if current network transaction volume increases. Expressed in user's
 *  preferred currency.
 * @property {string} [estimatedMaximumNative] - the maximum amount estimated to
 *  be paid if the current network transaction volume increases. Expressed in
 *  the network's native currency.
 */

/**
 * Uses gasFeeEstimates and state to keep track of user gas fee inputs.
 * Will update the gas fee state when estimates update if the user has not yet
 * modified the fields.
 * @param {EstimateLevel} defaultEstimateToUse - which estimate
 *  level to default the 'estimateToUse' state variable to.
 * @returns {GasFeeInputReturnType & import(
 *  './useGasFeeEstimates'
 * ).GasEstimates} - gas fee input state and the GasFeeEstimates object
 */
export function useGasFeeInputs(
  defaultEstimateToUse = 'medium',
  transaction,
  minimumGasLimit = '0x5208',
  editGasMode,
) {
  const supportsEIP1559 =
    useSelector(checkNetworkAndAccountSupports1559) &&
    !isLegacyTransaction(transaction?.txParams);

  // We need the gas estimates from the GasFeeController in the background.
  // Calling this hooks initiates polling for new gas estimates and returns the
  // current estimate.
  // todo: avoid calling in each hook
  const {
    gasEstimateType,
    gasFeeEstimates,
    isGasEstimatesLoading,
    estimatedGasFeeTimeBounds,
  } = useGasFeeEstimates();

  const userPrefersAdvancedGas = useSelector(getAdvancedInlineGasShown);

  const [estimateToUse, setInternalEstimateToUse] = useState(() => {
    if (
      userPrefersAdvancedGas &&
      transaction?.txParams?.maxPriorityFeePerGas &&
      transaction?.txParams?.maxFeePerGas
    )
      return null;
    if (transaction) return transaction?.userFeeLevel || null;
    return defaultEstimateToUse;
  });

  const [gasLimit, setGasLimit] = useState(
    Number(hexToDecimal(transaction?.txParams?.gas ?? '0x0')),
  );

  const {
    gasPrice,
    setGasPrice,
    setGasPriceHasBeenManuallySet,
  } = useGasPriceInputs({
    defaultEstimateToUse,
    estimateToUse,
    gasEstimateType,
    gasFeeEstimates,
    transaction,
  });

  const {
    maxFeePerGas,
    maxFeePerGasFiat,
    setMaxFeePerGas,
  } = useMaxFeePerGasInput({
    estimateToUse,
    gasEstimateType,
    gasFeeEstimates,
    gasLimit,
    gasPrice,
    supportsEIP1559,
    transaction,
  });

  const {
    maxPriorityFeePerGas,
    maxPriorityFeePerGasFiat,
    setMaxPriorityFeePerGas,
  } = useMaxPriorityFeePerGasInput({
    estimateToUse,
    gasEstimateType,
    gasFeeEstimates,
    gasLimit,
    supportsEIP1559,
    transaction,
  });

  const {
    estimatedBaseFee,
    estimatedMaximumFiat,
    estimatedMinimumFiat,
    estimatedMaximumNative,
    estimatedMinimumNative,
    minimumCostInHexWei,
  } = useGasEstimates({
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
  });

  const errorAndWarnings = useGasFeeErrors({
    gasLimit,
    gasPrice,
    maxPriorityFeePerGas,
    maxFeePerGas,
    minimumCostInHexWei,
    minimumGasLimit,
    transaction,
  });

  const handleGasLimitOutOfBoundError = useCallback(() => {
    if (
      errorAndWarnings.gasErrors.gasLimit ===
      GAS_FORM_ERRORS.GAS_LIMIT_OUT_OF_BOUNDS
    ) {
      const transactionGasLimitDec = hexToDecimal(transaction?.txParams?.gas);
      const minimumGasLimitDec = hexToDecimal(minimumGasLimit);
      setGasLimit(
        transactionGasLimitDec > minimumGasLimitDec
          ? transactionGasLimitDec
          : minimumGasLimitDec,
      );
    }
  }, [minimumGasLimit, errorAndWarnings.gasErrors.gasLimit, transaction]);

  // When a user selects an estimate level, it will wipe out what they have
  // previously put in the inputs. This returns the inputs to the estimated
  // values at the level specified.
  const setEstimateToUse = (estimateLevel) => {
    setInternalEstimateToUse(estimateLevel);
    handleGasLimitOutOfBoundError();
    setMaxFeePerGas(null);
    setMaxPriorityFeePerGas(null);
    setGasPrice(null);
    setGasPriceHasBeenManuallySet(false);
  };

  const onManualChange = () => {
    setInternalEstimateToUse('custom');
    handleGasLimitOutOfBoundError();
    // Restore existing values
    setGasPrice(gasPrice);
    setGasLimit(gasLimit);
    setMaxFeePerGas(maxFeePerGas);
    setMaxPriorityFeePerGas(maxPriorityFeePerGas);
    setGasPriceHasBeenManuallySet(true);
  };

  return {
    maxFeePerGas,
    maxFeePerGasFiat,
    setMaxFeePerGas,
    maxPriorityFeePerGas,
    maxPriorityFeePerGasFiat,
    setMaxPriorityFeePerGas,
    gasPrice,
    setGasPrice,
    gasLimit,
    setGasLimit,
    estimateToUse,
    setEstimateToUse,
    estimatedMinimumFiat,
    estimatedMaximumFiat,
    estimatedMaximumNative,
    estimatedMinimumNative,
    isGasEstimatesLoading,
    gasFeeEstimates,
    gasEstimateType,
    estimatedGasFeeTimeBounds,
    onManualChange,
    estimatedBaseFee,
    ...errorAndWarnings,
  };
}
