import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { EDIT_GAS_MODES, PRIORITY_LEVELS } from '../../../shared/constants/gas';
import {
  decimalToHex,
  decGWEIToHexWEI,
} from '../../helpers/utils/conversions.util';
import { addTenPercentAndRound } from '../../helpers/utils/gas';
import {
  createCancelTransaction,
  createSpeedUpTransaction,
  updateCustomSwapsEIP1559GasParams,
  updateSwapsUserFeeLevel,
  updateTransaction as updateTransactionFn,
} from '../../store/actions';
import { useTransactionMetrics } from '../useTransactionMetrics';

export const useTransactionFunctions = ({
  defaultEstimateToUse,
  editGasMode,
  estimatedBaseFee,
  gasFeeEstimates,
  gasLimit: gasLimitValue,
  maxPriorityFeePerGas: maxPriorityFeePerGasValue,
  transaction,
}) => {
  const dispatch = useDispatch();
  const { captureTransactionMetricsForEIP1559V2 } = useTransactionMetrics();

  const getTxMeta = useCallback(() => {
    if (
      (editGasMode !== EDIT_GAS_MODES.CANCEL &&
        editGasMode !== EDIT_GAS_MODES.SPEED_UP) ||
      transaction.previousGas
    ) {
      return {};
    }
    const {
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasLimit,
    } = transaction?.txParams;
    return {
      previousGas: {
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit,
      },
    };
  }, [editGasMode, transaction?.previousGas, transaction?.txParams]);

  const updateTransaction = useCallback(
    ({ estimateUsed, gasLimit, maxFeePerGas, maxPriorityFeePerGas }) => {
      const newGasSettings = {
        gas: decimalToHex(gasLimit || gasLimitValue),
        gasLimit: decimalToHex(gasLimit || gasLimitValue),
        estimateSuggested: defaultEstimateToUse,
        estimateUsed,
      };
      if (maxFeePerGas) {
        newGasSettings.maxFeePerGas = maxFeePerGas;
      }
      if (maxPriorityFeePerGas) {
        newGasSettings.maxPriorityFeePerGas =
          maxPriorityFeePerGas || decGWEIToHexWEI(maxPriorityFeePerGasValue);
      }
      const txMeta = getTxMeta();

      const updatedTxMeta = {
        ...transaction,
        userFeeLevel: estimateUsed || PRIORITY_LEVELS.CUSTOM,
        txParams: {
          ...transaction.txParams,
          ...newGasSettings,
        },
        ...txMeta,
      };

      if (editGasMode === EDIT_GAS_MODES.SWAPS) {
        dispatch(
          updateSwapsUserFeeLevel(estimateUsed || PRIORITY_LEVELS.CUSTOM),
        );
        dispatch(updateCustomSwapsEIP1559GasParams(newGasSettings));
      } else {
        dispatch(updateTransactionFn(updatedTxMeta));
      }
    },
    [
      defaultEstimateToUse,
      dispatch,
      editGasMode,
      gasLimitValue,
      getTxMeta,
      maxPriorityFeePerGasValue,
      transaction,
    ],
  );

  const cancelTransaction = useCallback(() => {
    const { maxFeePerGas, maxPriorityFeePerGas } = transaction.txParams;
    captureTransactionMetricsForEIP1559V2({
      action: 'Cancel / Speed-Up Transaction',
      name: `Gas Canceled`,
      variables: { maxFeePerGas, maxPriorityFeePerGas },
    });

    dispatch(
      createCancelTransaction(transaction.id, transaction.txParams, {
        estimatedBaseFee,
      }),
    );
  }, [
    captureTransactionMetricsForEIP1559V2,
    dispatch,
    estimatedBaseFee,
    transaction,
  ]);

  const speedUpTransaction = useCallback(() => {
    const { maxFeePerGas, maxPriorityFeePerGas } = transaction.txParams;
    captureTransactionMetricsForEIP1559V2({
      action: 'Cancel / Speed-Up Transaction',
      name: `Gas Speed-Up`,
      variables: { maxFeePerGas, maxPriorityFeePerGas },
    });

    dispatch(
      createSpeedUpTransaction(transaction.id, transaction.txParams, {
        estimatedBaseFee,
      }),
    );
  }, [
    captureTransactionMetricsForEIP1559V2,
    dispatch,
    estimatedBaseFee,
    transaction,
  ]);

  const updateTransactionToTenPercentIncreasedGasFee = useCallback(() => {
    const { gas: gasLimit, maxFeePerGas, maxPriorityFeePerGas } =
      transaction.previousGas || transaction.txParams;

    updateTransaction({
      estimateUsed: PRIORITY_LEVELS.TEN_PERCENT_INCREASED,
      gasLimit,
      maxFeePerGas: addTenPercentAndRound(maxFeePerGas),
      maxPriorityFeePerGas: addTenPercentAndRound(maxPriorityFeePerGas),
    });
  }, [transaction, updateTransaction]);

  const updateTransactionUsingEstimate = useCallback(
    (gasFeeEstimateToUse) => {
      if (!gasFeeEstimates[gasFeeEstimateToUse]) {
        return;
      }
      const {
        suggestedMaxFeePerGas,
        suggestedMaxPriorityFeePerGas,
      } = gasFeeEstimates[gasFeeEstimateToUse];
      updateTransaction({
        estimateUsed: gasFeeEstimateToUse,
        maxFeePerGas: decGWEIToHexWEI(suggestedMaxFeePerGas),
        maxPriorityFeePerGas: decGWEIToHexWEI(suggestedMaxPriorityFeePerGas),
      });
    },
    [gasFeeEstimates, updateTransaction],
  );

  const updateTransactionUsingDAPPSuggestedValues = useCallback(() => {
    const {
      maxFeePerGas,
      maxPriorityFeePerGas,
    } = transaction?.dappSuggestedGasFees;
    updateTransaction({
      estimateUsed: PRIORITY_LEVELS.DAPP_SUGGESTED,
      maxFeePerGas,
      maxPriorityFeePerGas,
    });
  }, [transaction, updateTransaction]);

  return {
    cancelTransaction,
    speedUpTransaction,
    updateTransaction,
    updateTransactionToTenPercentIncreasedGasFee,
    updateTransactionUsingDAPPSuggestedValues,
    updateTransactionUsingEstimate,
  };
};
