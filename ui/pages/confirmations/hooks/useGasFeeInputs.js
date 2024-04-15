import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import {
  CUSTOM_GAS_ESTIMATE,
  GasRecommendations,
  EditGasModes,
  PriorityLevels,
} from '../../../../shared/constants/gas';
import { GAS_FORM_ERRORS } from '../../../helpers/constants/gas';
import {
  checkNetworkAndAccountSupports1559,
  getAdvancedInlineGasShown,
} from '../../../selectors';
import { isLegacyTransaction } from '../../../helpers/utils/transactions.util';
import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';

import { editGasModeIsSpeedUpOrCancel } from '../../../helpers/utils/gas';
import { hexToDecimal } from '../../../../shared/modules/conversion.utils';
import { Numeric } from '../../../../shared/modules/Numeric';
import { EtherDenomination } from '../../../../shared/constants/common';
import { useGasFeeErrors } from './useGasFeeErrors';
import { useGasPriceInput } from './useGasPriceInput';
import { useMaxFeePerGasInput } from './useMaxFeePerGasInput';
import { useMaxPriorityFeePerGasInput } from './useMaxPriorityFeePerGasInput';
import { useGasEstimates } from './useGasEstimates';
import { useTransactionFunctions } from './useTransactionFunctions';

/**
 * In EIP_1559_V2 implementation as used by useGasfeeInputContext() the use of this hook is evolved.
 * It is no longer used to keep transient state of advance gas fee inputs.
 * Transient state of inputs is maintained locally in /ui/components/app/advance-gas-fee-popover component.
 *
 * This hook is used now as source of shared data about transaction, it shares details of gas fee in transaction,
 * estimate used, is EIP-1559 supported and other details. It also  have methods to update transaction.
 *
 * Transaction is used as single source of truth and as transaction is updated the fields shared by hook are
 * also updated using useEffect hook.
 *
 * It will be useful to plan a task to create a new hook of this shared information from this hook.
 * Methods like setEstimateToUse, onManualChange are deprecated in context of EIP_1559_V2 implementation.
 */

/**
 * @typedef {object} GasFeeInputReturnType
 * @property {object} [transaction] - .
 * @property {DecGweiString} [maxFeePerGas] - the maxFeePerGas input value.
 * @property {DecGweiString} [maxPriorityFeePerGas] - the maxPriorityFeePerGas
 *  input value.
 * @property {DecGweiString} [gasPrice] - the gasPrice input value.
 * @property {(DecGweiString) => void} setGasPrice - state setter method to
 *  update the gasPrice.
 * @property {DecGweiString} gasLimit - the gasLimit input value.
 * @property {(DecGweiString) => void} setGasLimit - state setter method to
 *  update the gasLimit.
 * @property {DecGweiString} [properGasLimit] - proper gas limit.
 * @property {string} [editGasMode] - one of CANCEL, SPEED-UP, MODIFY_IN_PLACE, SWAPS.
 * @property {EstimateLevel} [estimateToUse] - the estimate level currently
 *  selected. This will be null if the user has ejected from using the estimates.
 * @property {boolean} [isGasEstimatesLoading] - true if gas estimate is loading.
 * @property {DecGweiString} [maximumCostInHexWei] - maximum cost of transaction in HexWei.
 * @property {DecGweiString} [minimumCostInHexWei] - minimum cost of transaction in HexWei.
 * @property {string} [estimateUsed] - estimate used in the transaction.
 * @property {boolean} [isNetworkBusy] - true if network is busy.
 * @property {() => void} [onManualChange] - function to call when transaction is manually changed.
 * @property {boolean} [balanceError] - true if user balance is less than transaction value.
 * @property {object} [gasErrors] - object of gas errors.
 * @property {boolean} [hasGasErrors] - true if there are gas errors.
 * @property {boolean} [hasSimulationError] - true if simulation error exists.
 * @property {number} [minimumGasLimitDec] - minimum gas limit in decimals.
 * @property {boolean} [supportsEIP1559] - true if EIP1559 is cupported.
 * @property {() => void} cancelTransaction - cancel the transaction.
 * @property {() => void} speedUpTransaction - speed up the transaction.
 * @property {(string, number, number, number, string) => void} updateTransaction - update the transaction.
 * @property {(boolean) => void} updateTransactionToTenPercentIncreasedGasFee - update the cancel / speed transaction to
 * gas fee which is equal to current gas fee +10 percent.
 * @property {(string) => void} updateTransactionUsingDAPPSuggestedValues - update the transaction to DAPP suggested gas value.
 * @property {(string) => void} updateTransactionUsingEstimate - update the transaction using the estimate passed.
 */

/**
 * Uses gasFeeEstimates and state to keep track of user gas fee inputs.
 * Will update the gas fee state when estimates update if the user has not yet
 * modified the fields.
 *
 * @param {GasRecommendations} [defaultEstimateToUse] - which estimate
 *  level to default the 'estimateToUse' state variable to.
 * @param {object} [_transaction]
 * @param {string} [minimumGasLimit]
 * @param {EditGasModes[keyof EditGasModes]} editGasMode
 * @returns {GasFeeInputReturnType & import(
 *  '../../../hooks/useGasFeeEstimates'
 * ).GasEstimates} gas fee input state and the GasFeeEstimates object
 */

const GAS_LIMIT_TOO_HIGH_IN_ETH = '1';
export function useGasFeeInputs(
  defaultEstimateToUse = GasRecommendations.medium,
  _transaction,
  minimumGasLimit = '0x5208',
  editGasMode = EditGasModes.modifyInPlace,
) {
  const initialRetryTxMeta = {
    txParams: _transaction?.txParams,
    id: _transaction?.id,
    userFeeLevel: _transaction?.userFeeLevel,
    originalGasEstimate: _transaction?.originalGasEstimate,
    userEditedGasLimit: _transaction?.userEditedGasLimit,
  };

  if (_transaction?.previousGas) {
    initialRetryTxMeta.previousGas = _transaction?.previousGas;
  }

  const [retryTxMeta, setRetryTxMeta] = useState(initialRetryTxMeta);

  const transaction = editGasModeIsSpeedUpOrCancel(editGasMode)
    ? retryTxMeta
    : _transaction;

  const supportsEIP1559 =
    useSelector(checkNetworkAndAccountSupports1559) &&
    !isLegacyTransaction(transaction?.txParams);

  // We need the gas estimates from the GasFeeController in the background.
  // Calling this hooks initiates polling for new gas estimates and returns the
  // current estimate.
  const {
    gasEstimateType,
    gasFeeEstimates,
    isGasEstimatesLoading,
    isNetworkBusy,
  } = useGasFeeEstimates(transaction?.networkClientId);

  const userPrefersAdvancedGas = useSelector(getAdvancedInlineGasShown);

  const [estimateToUse, setInternalEstimateToUse] = useState(() => {
    if (
      userPrefersAdvancedGas &&
      transaction?.txParams?.maxPriorityFeePerGas &&
      transaction?.txParams?.maxFeePerGas
    ) {
      return null;
    }
    if (transaction) {
      return transaction?.userFeeLevel || null;
    }
    return defaultEstimateToUse;
  });

  const [estimateUsed, setEstimateUsed] = useState(() => {
    if (estimateToUse) {
      return estimateToUse;
    }
    return PriorityLevels.custom;
  });

  const [gasLimit, setGasLimit] = useState(() =>
    Number(hexToDecimal(transaction?.txParams?.gas ?? '0x0')),
  );

  const properGasLimit = Number(hexToDecimal(transaction?.originalGasEstimate));

  /**
   * In EIP-1559 V2 designs change to gas estimate is always updated to transaction
   * Thus callback setEstimateToUse can be deprecate in favor of this useEffect
   * so that transaction is source of truth whenever possible.
   */
  useEffect(() => {
    if (supportsEIP1559) {
      if (transaction?.userFeeLevel) {
        setInternalEstimateToUse(transaction?.userFeeLevel);
      }

      const maximumGas = new Numeric(transaction?.txParams?.gas ?? '0x0', 16)
        .times(new Numeric(transaction?.txParams?.maxFeePerGas ?? '0x0', 16))
        .toPrefixedHexString();

      const fee = new Numeric(maximumGas, 16, EtherDenomination.WEI)
        .toDenomination(EtherDenomination.ETH)
        .toBase(10)
        .toString();

      if (Number(fee) > Number(GAS_LIMIT_TOO_HIGH_IN_ETH)) {
        setEstimateUsed(PriorityLevels.dappSuggestedHigh);
      } else if (transaction?.userFeeLevel) {
        setEstimateUsed(transaction?.userFeeLevel);
      }

      setGasLimit(Number(hexToDecimal(transaction?.txParams?.gas ?? '0x0')));
    }
  }, [
    setEstimateUsed,
    setGasLimit,
    setInternalEstimateToUse,
    supportsEIP1559,
    transaction,
  ]);

  const { gasPrice, setGasPrice, setGasPriceHasBeenManuallySet } =
    useGasPriceInput({
      estimateToUse,
      gasEstimateType,
      gasFeeEstimates,
      transaction,
    });

  const { maxFeePerGas, setMaxFeePerGas } = useMaxFeePerGasInput({
    estimateToUse,
    gasEstimateType,
    gasFeeEstimates,
    transaction,
  });

  const { maxPriorityFeePerGas, setMaxPriorityFeePerGas } =
    useMaxPriorityFeePerGasInput({
      estimateToUse,
      gasEstimateType,
      gasFeeEstimates,
      transaction,
    });

  const { estimatedMinimumNative, maximumCostInHexWei, minimumCostInHexWei } =
    useGasEstimates({
      editGasMode,
      gasEstimateType,
      gasFeeEstimates,
      gasLimit,
      gasPrice,
      maxFeePerGas,
      maxPriorityFeePerGas,
      minimumGasLimit,
      transaction,
    });

  const { balanceError, gasErrors, hasGasErrors, hasSimulationError } =
    useGasFeeErrors({
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
    });

  const handleGasLimitOutOfBoundError = useCallback(() => {
    if (gasErrors.gasLimit === GAS_FORM_ERRORS.GAS_LIMIT_OUT_OF_BOUNDS) {
      const transactionGasLimitDec = hexToDecimal(transaction?.txParams?.gas);
      const minimumGasLimitDec = hexToDecimal(minimumGasLimit);
      setGasLimit(
        transactionGasLimitDec > minimumGasLimitDec
          ? transactionGasLimitDec
          : minimumGasLimitDec,
      );
    }
  }, [minimumGasLimit, gasErrors.gasLimit, transaction]);

  const {
    cancelTransaction,
    speedUpTransaction,
    updateTransaction,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingDAPPSuggestedValues,
    updateTransactionUsingEstimate,
  } = useTransactionFunctions({
    defaultEstimateToUse,
    editGasMode,
    gasFeeEstimates,
    gasLimit,
    maxPriorityFeePerGas,
    minimumGasLimit,
    transaction,
    setRetryTxMeta,
  });

  const onManualChange = useCallback(() => {
    setInternalEstimateToUse(CUSTOM_GAS_ESTIMATE);
    handleGasLimitOutOfBoundError();
    // Restore existing values
    setGasPrice(gasPrice);
    setGasLimit(gasLimit);
    setMaxFeePerGas(maxFeePerGas);
    setMaxPriorityFeePerGas(maxPriorityFeePerGas);
    setGasPriceHasBeenManuallySet(true);
    setEstimateUsed('custom');
  }, [
    setInternalEstimateToUse,
    handleGasLimitOutOfBoundError,
    setGasPrice,
    gasPrice,
    setGasLimit,
    gasLimit,
    setMaxFeePerGas,
    maxFeePerGas,
    setMaxPriorityFeePerGas,
    maxPriorityFeePerGas,
    setGasPriceHasBeenManuallySet,
  ]);

  return {
    transaction,
    maxFeePerGas,
    maxPriorityFeePerGas,
    gasPrice,
    setGasPrice,
    gasLimit,
    setGasLimit,
    properGasLimit,
    editGasMode,
    estimateToUse,
    estimatedMinimumNative,
    maximumCostInHexWei,
    minimumCostInHexWei,
    estimateUsed,
    gasFeeEstimates,
    isNetworkBusy,
    onManualChange,
    // error and warnings
    balanceError,
    gasErrors,
    hasGasErrors,
    hasSimulationError,
    minimumGasLimitDec: hexToDecimal(minimumGasLimit),
    supportsEIP1559,
    cancelTransaction,
    speedUpTransaction,
    updateTransaction,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingDAPPSuggestedValues,
    updateTransactionUsingEstimate,
  };
}
