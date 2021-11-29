import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { PRIORITY_LEVELS } from '../../../shared/constants/gas';
import { decimalToHex } from '../../helpers/utils/conversions.util';
import { updateTransaction as updateTransactionFn } from '../../store/actions';

export const useTransactionFunctions = ({
  defaultEstimateToUse,
  gasLimit,
  transaction,
}) => {
  const dispatch = useDispatch();

  const updateTransaction = useCallback(
    (estimateUsed, maxFeePerGas, maxPriorityFeePerGas) => {
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
    [defaultEstimateToUse, dispatch, gasLimit, transaction],
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
        updateTransaction(gasFeeEstimateToUse);
      }
    },
    [transaction?.dappSuggestedGasFees, updateTransaction],
  );

  return { updateTransactionUsingGasFeeEstimates };
};
