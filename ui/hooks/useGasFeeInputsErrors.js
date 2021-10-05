import { useSelector } from 'react-redux';
import { GAS_ESTIMATE_TYPES, GAS_LIMITS } from '../../shared/constants/gas';
import {
  conversionLessThan,
  conversionGreaterThan,
} from '../../shared/modules/conversion.utils';
import {
  checkNetworkAndAccountSupports1559,
  getSelectedAccount,
} from '../selectors';
import { addHexes } from '../helpers/utils/conversions.util';
import {
  bnGreaterThan,
  bnLessThan,
  bnLessThanEqualTo,
} from '../helpers/utils/util';
import { GAS_FORM_ERRORS } from '../helpers/constants/gas';

import { useGasFeeEstimates } from './useGasFeeEstimates';

const HIGH_FEE_WARNING_MULTIPLIER = 1.5;

const validateGasLimit = (gasLimit, minimumGasLimit) => {
  const gasLimitTooLow = conversionLessThan(
    { value: gasLimit, fromNumericBase: 'dec' },
    { value: minimumGasLimit || GAS_LIMITS.SIMPLE, fromNumericBase: 'hex' },
  );

  if (gasLimitTooLow) return GAS_FORM_ERRORS.GAS_LIMIT_OUT_OF_BOUNDS;
  return undefined;
};

const validateMaxPriorityFee = (
  networkAndAccountSupports1559,
  maxPriorityFeePerGasToUse,
  isGasEstimatesLoading,
  gasFeeEstimates,
  gasEstimateType,
) => {
  let maxPriorityFeeError;
  if (
    (networkAndAccountSupports1559 ||
      gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) &&
    bnLessThanEqualTo(maxPriorityFeePerGasToUse, 0)
  ) {
    maxPriorityFeeError = GAS_FORM_ERRORS.MAX_PRIORITY_FEE_BELOW_MINIMUM;
  } else if (
    gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET &&
    !isGasEstimatesLoading &&
    bnLessThan(
      maxPriorityFeePerGasToUse,
      gasFeeEstimates?.low?.suggestedMaxPriorityFeePerGas,
    )
  ) {
    maxPriorityFeeError = GAS_FORM_ERRORS.MAX_PRIORITY_FEE_TOO_LOW;
  }
  return maxPriorityFeeError;
};

const validateMaxFee = (
  networkAndAccountSupports1559,
  maxPriorityFeePerGasToUse,
  maxFeePerGasToUse,
  gasEstimateType,
) => {
  if (
    (networkAndAccountSupports1559 ||
      gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET) &&
    bnGreaterThan(maxPriorityFeePerGasToUse, maxFeePerGasToUse)
  )
    return GAS_FORM_ERRORS.MAX_FEE_IMBALANCE;
  return undefined;
};

const validateGasPrice = (
  networkAndAccountSupports1559,
  transaction,
  gasPriceToUse,
  gasEstimateType,
) => {
  if (
    (!networkAndAccountSupports1559 || transaction?.txParams?.gasPrice) &&
    gasEstimateType !== GAS_ESTIMATE_TYPES.FEE_MARKET &&
    bnLessThanEqualTo(gasPriceToUse, 0)
  )
    return GAS_FORM_ERRORS.GAS_PRICE_TOO_LOW;
  return undefined;
};

const getMaxPriorityFeeWarning = (
  gasEstimateType,
  gasFeeEstimates,
  maxPriorityFeePerGasToUse,
) => {
  if (
    gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET &&
    gasFeeEstimates?.high &&
    bnGreaterThan(
      maxPriorityFeePerGasToUse,
      gasFeeEstimates.high.suggestedMaxPriorityFeePerGas *
        HIGH_FEE_WARNING_MULTIPLIER,
    )
  )
    return GAS_FORM_ERRORS.MAX_PRIORITY_FEE_HIGH_WARNING;
  return undefined;
};

const getMaxFeeWarning = (
  isGasEstimatesLoading,
  maxFeePerGasToUse,
  gasFeeEstimates,
  gasEstimateType,
) => {
  if (
    gasEstimateType === GAS_ESTIMATE_TYPES.FEE_MARKET &&
    !isGasEstimatesLoading &&
    bnLessThan(maxFeePerGasToUse, gasFeeEstimates?.low?.suggestedMaxFeePerGas)
  ) {
    return GAS_FORM_ERRORS.MAX_FEE_TOO_LOW;
  } else if (
    gasFeeEstimates?.high &&
    bnGreaterThan(
      maxFeePerGasToUse,
      gasFeeEstimates.high.suggestedMaxFeePerGas * HIGH_FEE_WARNING_MULTIPLIER,
    )
  ) {
    return GAS_FORM_ERRORS.MAX_FEE_HIGH_WARNING;
  }
  return undefined;
};

const getBalanceError = (minimumCostInHexWei, transaction, ethBalance) => {
  const minimumTxCostInHexWei = addHexes(
    minimumCostInHexWei,
    transaction?.txParams?.value || '0x0',
  );

  return conversionGreaterThan(
    { value: minimumTxCostInHexWei, fromNumericBase: 'hex' },
    { value: ethBalance, fromNumericBase: 'hex' },
  );
};

export function useGasFeeInputsErrors(
  transaction,
  gasLimit,
  gasPriceToUse,
  maxPriorityFeePerGasToUse,
  maxFeePerGasToUse,
  minimumCostInHexWei,
  minimumGasLimit,
) {
  const { balance: ethBalance } = useSelector(getSelectedAccount);
  const networkAndAccountSupports1559 = useSelector(
    checkNetworkAndAccountSupports1559,
  );
  const {
    gasEstimateType,
    gasFeeEstimates,
    isGasEstimatesLoading,
  } = useGasFeeEstimates();

  // Separating errors from warnings so we can know which value problems
  // are blocking or simply useful information for the users
  const gasErrors = {};
  const gasWarnings = {};
  const estimatesUnavailableWarning =
    networkAndAccountSupports1559 &&
    gasEstimateType !== GAS_ESTIMATE_TYPES.FEE_MARKET;

  gasErrors.gasLimit = validateGasLimit(gasLimit, minimumGasLimit);
  gasErrors.maxPriorityFee = validateMaxPriorityFee(
    networkAndAccountSupports1559,
    maxPriorityFeePerGasToUse,
    isGasEstimatesLoading,
    gasFeeEstimates,
  );
  gasErrors.maxFee = validateMaxFee(
    networkAndAccountSupports1559,
    maxPriorityFeePerGasToUse,
    maxFeePerGasToUse,
  );
  gasErrors.gasPrice = validateGasPrice(
    networkAndAccountSupports1559,
    transaction,
    gasPriceToUse,
    gasEstimateType,
  );

  gasWarnings.maxPriorityFee = getMaxPriorityFeeWarning(
    gasEstimateType,
    gasFeeEstimates,
    maxPriorityFeePerGasToUse,
  );
  gasWarnings.maxFee = getMaxFeeWarning(
    isGasEstimatesLoading,
    maxFeePerGasToUse,
    gasFeeEstimates,
    gasEstimateType,
  );

  // Determine if we have any errors which should block submission
  const hasGasErrors = Boolean(Object.keys(gasErrors).length);

  // Now that we've determined errors that block submission, we can pool the warnings
  // and errors into one object for easier use within the UI.  This object should have
  // no effect on whether or not the user can submit the form
  const errorsAndWarnings = {
    ...gasWarnings,
    ...gasErrors,
  };

  const balanceError = getBalanceError(
    minimumCostInHexWei,
    transaction,
    ethBalance,
  );

  return {
    gasErrors: errorsAndWarnings,
    hasGasErrors,
    gasWarnings,
    balanceError,
    estimatesUnavailableWarning,
  };
}
