import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { EDIT_GAS_MODES, PRIORITY_LEVELS } from '../../../shared/constants/gas';
import {
  decimalToHex,
  decGWEIToHexWEI,
} from '../../helpers/utils/conversions.util';
import {
  updateCustomSwapsEIP1559GasParams,
  updateSwapsUserFeeLevel,
  updateTransaction as updateTransactionFn,
} from '../../store/actions';

export const useTransactionFunctions = ({
  defaultEstimateToUse,
  editGasMode,
  gasFeeEstimates,
  gasLimit: gasLimitInTransaction,
  transaction,
}) => {
  const dispatch = useDispatch();

  const updateTransaction = useCallback(
    ({
      estimateUsed,
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasLimit = gasLimitInTransaction,
    }) => {
      const newGasSettings = {
        gas: decimalToHex(gasLimit),
        gasLimit: decimalToHex(gasLimit),
        estimateSuggested: defaultEstimateToUse,
        estimateUsed,
      };
      if (maxFeePerGas) {
        newGasSettings.maxFeePerGas = maxFeePerGas;
      }
      if (maxPriorityFeePerGas) {
        newGasSettings.maxPriorityFeePerGas = maxPriorityFeePerGas;
      }

      const updatedTxMeta = {
        ...transaction,
        userFeeLevel: estimateUsed || PRIORITY_LEVELS.CUSTOM,
        txParams: {
          ...transaction.txParams,
          ...newGasSettings,
        },
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
      gasLimitInTransaction,
      transaction,
    ],
  );

  const updateTransactionUsingGasFeeEstimates = useCallback(
    (gasFeeEstimateToUse) => {
      if (gasFeeEstimateToUse === PRIORITY_LEVELS.DAPP_SUGGESTED) {
        const {
          maxFeePerGas,
          maxPriorityFeePerGas,
        } = transaction?.dappSuggestedGasFees;
        updateTransaction({
          estimateUsed: PRIORITY_LEVELS.DAPP_SUGGESTED,
          maxFeePerGas,
          maxPriorityFeePerGas,
        });
      } else {
        const {
          suggestedMaxFeePerGas,
          suggestedMaxPriorityFeePerGas,
        } = gasFeeEstimates[gasFeeEstimateToUse];
        updateTransaction({
          estimateUsed: gasFeeEstimateToUse,
          maxFeePerGas: decGWEIToHexWEI(suggestedMaxFeePerGas),
          maxPriorityFeePerGas: decGWEIToHexWEI(suggestedMaxPriorityFeePerGas),
        });
      }
    },
    [gasFeeEstimates, transaction?.dappSuggestedGasFees, updateTransaction],
  );

  return { updateTransaction, updateTransactionUsingGasFeeEstimates };
};
