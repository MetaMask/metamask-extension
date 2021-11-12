import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { GAS_ESTIMATE } from '../../../shared/constants/gas';
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
    (estimateUsed, maxFeePerGas, maxPriorityFeePerGas) => {
      const newGasSettings = {
        gas: decimalToHex(gasLimit),
        gasLimit: decimalToHex(gasLimit),
        estimateSuggested: defaultEstimateToUse,
        estimateUsed,
        maxFeePerGas,
        maxPriorityFeePerGas,
      };

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
    (estimateType) => {
      if (estimateType === GAS_ESTIMATE.DAPP_SUGGESTED) {
        const {
          maxFeePerGas,
          maxPriorityFeePerGas,
        } = transaction?.dappSuggestedGasFees;
        updateTransaction(
          GAS_ESTIMATE.CUSTOM,
          maxFeePerGas,
          maxPriorityFeePerGas,
        );
      } else {
        const {
          suggestedMaxFeePerGas,
          suggestedMaxPriorityFeePerGas,
        } = gasFeeEstimates[estimateType];
        updateTransaction(
          estimateType,
          decGWEIToHexWEI(suggestedMaxFeePerGas),
          decGWEIToHexWEI(suggestedMaxPriorityFeePerGas),
        );
      }
    },
    [gasFeeEstimates, transaction?.dappSuggestedGasFees, updateTransaction],
  );

  return { updateTransactionUsingGasFeeEstimates };
};
