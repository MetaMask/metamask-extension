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
  updatePreviousGasParams,
  updateSwapsUserFeeLevel,
  updateTransactionGasFees,
  updateTransactionUserSettings,
} from '../../store/actions';

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
    ({
      estimateUsed,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      estimateSuggested,
    }) => {
      const newGasSettings = {
        gas: decimalToHex(gasLimit || gasLimitValue),
        gasLimit: decimalToHex(gasLimit || gasLimitValue),
        estimateSuggested: estimateSuggested || defaultEstimateToUse,
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
        const userSettings = {};
        userSettings.userEditedGasLimit = updatedTxMeta.userEditedGasLimit;
        userSettings.userFeeLevel = updatedTxMeta.userFeeLevel;

        if (txMeta && txMeta.previousGas) {
          dispatch(
            updatePreviousGasParams(updatedTxMeta.id, txMeta.previousGas),
          );
        }

        dispatch(updateTransactionGasFees(updatedTxMeta.id, newGasSettings));
        dispatch(updateTransactionUserSettings(updatedTxMeta.id, userSettings));
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
    dispatch(
      createCancelTransaction(transaction.id, transaction.txParams, {
        estimatedBaseFee,
      }),
    );
  }, [dispatch, estimatedBaseFee, transaction]);

  const speedUpTransaction = useCallback(() => {
    dispatch(
      createSpeedUpTransaction(transaction.id, transaction.txParams, {
        estimatedBaseFee,
      }),
    );
  }, [dispatch, estimatedBaseFee, transaction]);

  const updateTransactionToTenPercentIncreasedGasFee = useCallback(
    (initTransaction = false) => {
      const { gas: gasLimit, maxFeePerGas, maxPriorityFeePerGas } =
        transaction.previousGas || transaction.txParams;

      updateTransaction({
        estimateSuggested: initTransaction
          ? defaultEstimateToUse
          : PRIORITY_LEVELS.TEN_PERCENT_INCREASED,
        estimateUsed: PRIORITY_LEVELS.TEN_PERCENT_INCREASED,
        gasLimit,
        maxFeePerGas: addTenPercentAndRound(maxFeePerGas),
        maxPriorityFeePerGas: addTenPercentAndRound(maxPriorityFeePerGas),
      });
    },
    [defaultEstimateToUse, transaction, updateTransaction],
  );

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
