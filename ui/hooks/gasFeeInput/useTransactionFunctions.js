import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import {
  decGWEIToHexWEI,
  decimalToHex,
} from '../../helpers/utils/conversions.util';
import { updateTransaction as updateTransactionFn } from '../../store/actions';

export const useTransactionFunctions = ({
  defaultEstimateToUse,
  gasLimit,
  gasFeeEstimates,
  transaction,
}) => {
  const dispatch = useDispatch();

  const updateTransaction = useCallback(
    (estimateType) => {
      const newGasSettings = {
        gas: decimalToHex(gasLimit),
        gasLimit: decimalToHex(gasLimit),
        estimateSuggested: defaultEstimateToUse,
        estimateUsed: estimateType,
      };

      newGasSettings.maxFeePerGas = decGWEIToHexWEI(
        gasFeeEstimates[estimateType].suggestedMaxFeePerGas,
      );
      newGasSettings.maxPriorityFeePerGas = decGWEIToHexWEI(
        gasFeeEstimates[estimateType].suggestedMaxPriorityFeePerGas,
      );

      const updatedTxMeta = {
        ...transaction,
        userFeeLevel: estimateType || 'custom',
        txParams: {
          ...transaction.txParams,
          ...newGasSettings,
        },
      };

      dispatch(updateTransactionFn(updatedTxMeta));
    },
    [defaultEstimateToUse, dispatch, gasLimit, gasFeeEstimates, transaction],
  );

  return { updateTransaction };
};
