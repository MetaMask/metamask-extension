import BigNumber from 'bignumber.js';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { EDIT_GAS_MODES, PRIORITY_LEVELS } from '../../../shared/constants/gas';
import {
  decimalToHex,
  decGWEIToHexWEI,
  hexWEIToDecGWEI,
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
  gasLimit: gasLimitValue,
  maxPriorityFeePerGas: maxPriorityFeePerGasValue,
  minimumGasLimit,
  transaction,
}) => {
  const dispatch = useDispatch();

  const updateTransaction = useCallback(
    ({
      estimateUsed,
      gasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      txMeta,
    }) => {
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
      maxPriorityFeePerGasValue,
      transaction,
    ],
  );

  const updateTransactionUsingGasFeeEstimates = useCallback(
    (gasFeeEstimateToUse) => {
      if (gasFeeEstimateToUse === PRIORITY_LEVELS.MINIMUM) {
        console.log(transaction);
        const {
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit,
        } = transaction?.txParams;
        const txMeta = {};
        console.log('gasLimit = ', gasLimit);
        if (!transaction.previousGas) {
          txMeta.previousGas = {
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasLimit,
          };
        }
        updateTransaction({
          estimateUsed: gasFeeEstimateToUse,
          gasLimit:
            editGasMode === EDIT_GAS_MODES.CANCEL
              ? minimumGasLimit
              : transaction.previousGas?.gasLimit || gasLimit,
          maxFeePerGas: decGWEIToHexWEI(
            new BigNumber(
              hexWEIToDecGWEI(
                transaction.previousGas?.maxPriorityFeePerGas ||
                  maxPriorityFeePerGas,
              ),
            ).times(1.1),
          ),
          maxPriorityFeePerGas:
            transaction.previousGas?.maxFeePerGas || maxFeePerGas,
          txMeta,
        });
      } else if (gasFeeEstimateToUse === PRIORITY_LEVELS.DAPP_SUGGESTED) {
        const {
          maxFeePerGas,
          maxPriorityFeePerGas,
        } = transaction?.dappSuggestedGasFees;
        updateTransaction({
          estimateUsed: gasFeeEstimateToUse,
          maxFeePerGas,
          maxPriorityFeePerGas,
        });
      } else if (gasFeeEstimates[gasFeeEstimateToUse]) {
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
    [
      editGasMode,
      gasFeeEstimates,
      minimumGasLimit,
      transaction,
      updateTransaction,
    ],
  );

  return { updateTransaction, updateTransactionUsingGasFeeEstimates };
};
