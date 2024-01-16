import { useMemo } from 'react';
import { shallowEqual, useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { GasEstimateTypes, GAS_LIMITS } from '../../../shared/constants/gas';
import {
  checkNetworkAndAccountSupports1559,
  getTargetAccount,
} from '../../selectors';
import { isLegacyTransaction } from '../../helpers/utils/transactions.util';
import { bnGreaterThan, bnLessThan } from '../../helpers/utils/util';
import { GAS_FORM_ERRORS } from '../../helpers/constants/gas';
import { Numeric } from '../../../shared/modules/Numeric';
import { PENDING_STATUS_HASH } from '../../helpers/constants/transactions';

const HIGH_FEE_WARNING_MULTIPLIER = 1.5;

const validateGasLimit = (gasLimit, minimumGasLimit) => {
  const gasLimitTooLow = new Numeric(gasLimit, 10).lessThan(
    new Numeric(minimumGasLimit || GAS_LIMITS.SIMPLE, 16),
  );

  if (gasLimitTooLow) {
    return GAS_FORM_ERRORS.GAS_LIMIT_OUT_OF_BOUNDS;
  }
  return undefined;
};

const validateMaxPriorityFee = (maxPriorityFeePerGas, supportsEIP1559) => {
  if (!supportsEIP1559) {
    return undefined;
  }
  if (bnLessThan(maxPriorityFeePerGas, 0)) {
    return GAS_FORM_ERRORS.MAX_PRIORITY_FEE_BELOW_MINIMUM;
  }
  return undefined;
};

const validateMaxFee = (
  maxFeePerGas,
  maxPriorityFeeError,
  maxPriorityFeePerGas,
  supportsEIP1559,
) => {
  if (maxPriorityFeeError || !supportsEIP1559) {
    return undefined;
  }
  if (bnGreaterThan(maxPriorityFeePerGas, maxFeePerGas)) {
    return GAS_FORM_ERRORS.MAX_FEE_IMBALANCE;
  }
  return undefined;
};

const validateGasPrice = (
  isFeeMarketGasEstimate,
  gasPrice,
  supportsEIP1559,
  transaction,
) => {
  if (supportsEIP1559 && isFeeMarketGasEstimate) {
    return undefined;
  }
  if (
    (!supportsEIP1559 || transaction?.txParams?.gasPrice) &&
    bnLessThan(gasPrice, 0)
  ) {
    return GAS_FORM_ERRORS.GAS_PRICE_TOO_LOW;
  }
  return undefined;
};

const getMaxPriorityFeeWarning = (
  gasFeeEstimates,
  isFeeMarketGasEstimate,
  isGasEstimatesLoading,
  maxPriorityFeePerGas,
  supportsEIP1559,
) => {
  if (!supportsEIP1559 || !isFeeMarketGasEstimate || isGasEstimatesLoading) {
    return undefined;
  }
  if (
    bnLessThan(
      maxPriorityFeePerGas,
      gasFeeEstimates?.low?.suggestedMaxPriorityFeePerGas,
    )
  ) {
    return GAS_FORM_ERRORS.MAX_PRIORITY_FEE_TOO_LOW;
  }
  if (
    gasFeeEstimates?.high &&
    bnGreaterThan(
      maxPriorityFeePerGas,
      gasFeeEstimates.high.suggestedMaxPriorityFeePerGas *
        HIGH_FEE_WARNING_MULTIPLIER,
    )
  ) {
    return GAS_FORM_ERRORS.MAX_PRIORITY_FEE_HIGH_WARNING;
  }
  return undefined;
};

const getMaxFeeWarning = (
  gasFeeEstimates,
  isGasEstimatesLoading,
  isFeeMarketGasEstimate,
  maxFeeError,
  maxPriorityFeeError,
  maxFeePerGas,
  supportsEIP1559,
) => {
  if (
    maxPriorityFeeError ||
    maxFeeError ||
    !isFeeMarketGasEstimate ||
    !supportsEIP1559 ||
    isGasEstimatesLoading
  ) {
    return undefined;
  }
  if (bnLessThan(maxFeePerGas, gasFeeEstimates?.low?.suggestedMaxFeePerGas)) {
    return GAS_FORM_ERRORS.MAX_FEE_TOO_LOW;
  }
  if (
    gasFeeEstimates?.high &&
    bnGreaterThan(
      maxFeePerGas,
      gasFeeEstimates.high.suggestedMaxFeePerGas * HIGH_FEE_WARNING_MULTIPLIER,
    )
  ) {
    return GAS_FORM_ERRORS.MAX_FEE_HIGH_WARNING;
  }
  return undefined;
};

const hasBalanceError = (minimumCostInHexWei, transaction, ethBalance) => {
  if (minimumCostInHexWei === undefined || ethBalance === undefined) {
    return false;
  }
  const minimumTxCostInHexWei = new Numeric(minimumCostInHexWei, 16).add(
    new Numeric(transaction?.txParams?.value || '0x0', 16),
  );
  const ethBalanceInHexWei = new Numeric(ethBalance, 16);

  return minimumTxCostInHexWei.greaterThan(ethBalanceInHexWei);
};

/**
 * @typedef {object} GasFeeErrorsReturnType
 * @property {object} [gasErrors] - combined map of errors and warnings.
 * @property {boolean} [hasGasErrors] - true if there are errors that can block submission.
 * @property {boolean} [balanceError] - true if user balance is less than transaction value.
 * @property {boolean} [hasSimulationError] - true if simulation error exists.
 */

/**
 * @param options
 * @param options.gasEstimateType
 * @param options.gasFeeEstimates
 * @param options.isGasEstimatesLoading
 * @param options.gasLimit
 * @param options.gasPrice
 * @param options.maxPriorityFeePerGas
 * @param options.maxFeePerGas
 * @param options.minimumCostInHexWei
 * @param options.minimumGasLimit
 * @param options.transaction
 * @returns {GasFeeErrorsReturnType}
 */
export function useGasFeeErrors({
  gasEstimateType,
  gasFeeEstimates,
  isGasEstimatesLoading,
  gasLimit,
  gasPrice,
  maxPriorityFeePerGas,
  maxFeePerGas,
  minimumCostInHexWei,
  minimumGasLimit,
  transaction,
}) {
  const supportsEIP1559 =
    useSelector(checkNetworkAndAccountSupports1559) &&
    !isLegacyTransaction(transaction?.txParams);

  const isFeeMarketGasEstimate = gasEstimateType === GasEstimateTypes.feeMarket;

  // Get all errors
  const gasLimitError = validateGasLimit(gasLimit, minimumGasLimit);

  const maxPriorityFeeError = validateMaxPriorityFee(
    maxPriorityFeePerGas,
    supportsEIP1559,
  );

  const maxFeeError = validateMaxFee(
    maxFeePerGas,
    maxPriorityFeeError,
    maxPriorityFeePerGas,
    supportsEIP1559,
  );

  const gasPriceError = validateGasPrice(
    isFeeMarketGasEstimate,
    gasPrice,
    supportsEIP1559,
    transaction,
  );

  // Get all warnings
  const maxPriorityFeeWarning = getMaxPriorityFeeWarning(
    gasFeeEstimates,
    isFeeMarketGasEstimate,
    isGasEstimatesLoading,
    maxPriorityFeePerGas,
    supportsEIP1559,
  );

  const maxFeeWarning = getMaxFeeWarning(
    gasFeeEstimates,
    isGasEstimatesLoading,
    isFeeMarketGasEstimate,
    maxFeeError,
    maxPriorityFeeError,
    maxFeePerGas,
    supportsEIP1559,
  );

  // Separating errors from warnings so we can know which value problems
  // are blocking or simply useful information for the users

  const gasErrors = useMemo(() => {
    const errors = {};
    if (gasLimitError) {
      errors.gasLimit = gasLimitError;
    }
    if (maxPriorityFeeError) {
      errors.maxPriorityFee = maxPriorityFeeError;
    }
    if (maxFeeError) {
      errors.maxFee = maxFeeError;
    }
    if (gasPriceError) {
      errors.gasPrice = gasPriceError;
    }
    return errors;
  }, [gasLimitError, maxPriorityFeeError, maxFeeError, gasPriceError]);

  const gasWarnings = useMemo(() => {
    const warnings = {};
    if (maxPriorityFeeWarning) {
      warnings.maxPriorityFee = maxPriorityFeeWarning;
    }
    if (maxFeeWarning) {
      warnings.maxFee = maxFeeWarning;
    }
    return warnings;
  }, [maxPriorityFeeWarning, maxFeeWarning]);

  // Determine if we have any errors which should block submission
  const hasGasErrors = Boolean(Object.keys(gasErrors).length);

  // Combine the warnings and errors into one object for easier use within the UI.
  // This object should have no effect on whether or not the user can submit the form
  const errorsAndWarnings = useMemo(
    () => ({
      ...gasWarnings,
      ...gasErrors,
    }),
    [gasErrors, gasWarnings],
  );

  const account = useSelector(
    (state) => getTargetAccount(state, transaction?.txParams?.from),
    shallowEqual,
  );

  // Balance check is only relevant for outgoing + pending transactions
  const balanceError =
    account !== undefined &&
    transaction?.type !== TransactionType.incoming &&
    transaction?.status in PENDING_STATUS_HASH
      ? hasBalanceError(minimumCostInHexWei, transaction, account.balance)
      : false;

  return {
    gasErrors: errorsAndWarnings,
    hasGasErrors,
    balanceError,
    hasSimulationError: Boolean(transaction?.simulationFails),
  };
}
