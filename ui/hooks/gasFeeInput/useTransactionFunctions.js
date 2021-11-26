import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { PRIORITY_LEVELS } from '../../../shared/constants/gas';
import {
  decimalToHex,
  decGWEIToHexWEI,
} from '../../helpers/utils/conversions.util';
import { updateTransaction as updateTransactionFn } from '../../store/actions';

export const useTransactionFunctions = ({
  defaultEstimateToUse,
  gasFeeEstimates,
  gasLimit: gasLimitInTransaction,
  transaction,
}) => {
  const dispatch = useDispatch();

  const updateTransaction = useCallback(
    (
      estimateUsed,
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasLimit = gasLimitInTransaction,
    ) => {
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
        userFeeLevel: estimateUsed || 'custom',
        txParams: {
          ...transaction.txParams,
          ...newGasSettings,
        },
      };

      dispatch(updateTransactionFn(updatedTxMeta));
    },
    [defaultEstimateToUse, dispatch, gasLimitInTransaction, transaction],
  );

  const updateTransactionUsingGasFeeEstimates = useCallback(
    (gasFeeEstimateToUse) => {
      if (gasFeeEstimateToUse === PRIORITY_LEVELS.DAPP_SUGGESTED) {
        const {
          maxFeePerGas,
          maxPriorityFeePerGas,
        } = transaction?.dappSuggestedGasFees;
        updateTransaction(
          PRIORITY_LEVELS.DAPP_SUGGESTED,
          maxFeePerGas,
          maxPriorityFeePerGas,
        );
      } else {
        const {
          suggestedMaxFeePerGas,
          suggestedMaxPriorityFeePerGas,
        } = gasFeeEstimates[gasFeeEstimateToUse];
        updateTransaction(
          gasFeeEstimateToUse,
          decGWEIToHexWEI(suggestedMaxFeePerGas),
          decGWEIToHexWEI(suggestedMaxPriorityFeePerGas),
        );
      }
    },
    [gasFeeEstimates, transaction?.dappSuggestedGasFees, updateTransaction],
  );

  return { updateTransaction, updateTransactionUsingGasFeeEstimates };
};
