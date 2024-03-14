import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import BigNumber from 'bignumber.js';
import {
  EditGasModes,
  PriorityLevels,
  CUSTOM_GAS_ESTIMATE,
} from '../../../../shared/constants/gas';
import {
  addTenPercentAndRound,
  editGasModeIsSpeedUpOrCancel,
} from '../../../helpers/utils/gas';
import {
  createCancelTransaction,
  createSpeedUpTransaction,
  updateCustomSwapsEIP1559GasParams,
  updatePreviousGasParams,
  updateSwapsUserFeeLevel,
  updateTransactionGasFees,
} from '../../../store/actions';
import {
  decGWEIToHexWEI,
  decimalToHex,
} from '../../../../shared/modules/conversion.utils';

/**
 * @typedef {object} TransactionFunctionsReturnType
 * @property {() => void} cancelTransaction - cancel the transaction.
 * @property {() => void} speedUpTransaction - speed up the transaction.
 * @property {(string, number, number, number, string) => void} updateTransaction - update the transaction.
 * @property {(boolean) => void} updateTransactionToTenPercentIncreasedGasFee - update the cancel / speed transaction to
 * gas fee which is equal to current gas fee +10 percent.
 * @property {(string) => void} updateTransactionUsingDAPPSuggestedValues - update the transaction to DAPP suggested gas value.
 * @property {(string) => void} updateTransactionUsingEstimate - update the transaction using the estimate passed.
 */

/**
 * @param options
 * @param options.defaultEstimateToUse
 * @param options.editGasMode
 * @param options.estimatedBaseFee
 * @param options.gasFeeEstimates
 * @param options.gasLimit
 * @param options.maxPriorityFeePerGas
 * @param options.transaction
 * @param options.setRetryTxMeta
 * @returns {TransactionFunctionsReturnType}
 */
export const useTransactionFunctions = ({
  defaultEstimateToUse,
  editGasMode,
  estimatedBaseFee,
  gasFeeEstimates,
  gasLimit: gasLimitValue,
  maxPriorityFeePerGas: maxPriorityFeePerGasValue,
  transaction,
  setRetryTxMeta,
}) => {
  const dispatch = useDispatch();

  const getTxMeta = useCallback(() => {
    if (
      (editGasMode !== EditGasModes.cancel &&
        editGasMode !== EditGasModes.speedUp) ||
      transaction.previousGas
    ) {
      return {};
    }
    const { maxFeePerGas, maxPriorityFeePerGas, gasLimit } =
      transaction?.txParams ?? {};
    return {
      previousGas: {
        maxFeePerGas,
        maxPriorityFeePerGas,
        gasLimit,
      },
    };
  }, [editGasMode, transaction?.previousGas, transaction?.txParams]);

  const updateTransaction = useCallback(
    async ({
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
        userFeeLevel: estimateUsed || PriorityLevels.custom,
        txParams: {
          ...transaction.txParams,
          ...newGasSettings,
        },
        ...txMeta,
      };

      if (editGasMode === EditGasModes.swaps) {
        dispatch(
          updateSwapsUserFeeLevel(estimateUsed || PriorityLevels.custom),
        );
        dispatch(updateCustomSwapsEIP1559GasParams(newGasSettings));
      } else if (editGasModeIsSpeedUpOrCancel(editGasMode)) {
        setRetryTxMeta(updatedTxMeta);
      } else {
        newGasSettings.userEditedGasLimit = updatedTxMeta.userEditedGasLimit;
        newGasSettings.userFeeLevel = updatedTxMeta.userFeeLevel;

        if (txMeta && txMeta.previousGas) {
          await dispatch(
            updatePreviousGasParams(updatedTxMeta.id, txMeta.previousGas),
          );
        }

        await dispatch(
          updateTransactionGasFees(updatedTxMeta.id, newGasSettings),
        );
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
      setRetryTxMeta,
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
      const {
        gas: gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas,
      } = transaction.previousGas || transaction.txParams;

      const newMaxPriorityFeePerGas = new BigNumber(
        maxPriorityFeePerGas,
        16,
      ).isZero()
        ? decGWEIToHexWEI(
            gasFeeEstimates[defaultEstimateToUse].suggestedMaxPriorityFeePerGas,
          )
        : maxPriorityFeePerGas;

      const estimateUsed =
        maxPriorityFeePerGas === '0x0'
          ? CUSTOM_GAS_ESTIMATE
          : PriorityLevels.tenPercentIncreased;

      if (!gasFeeEstimates) {
        return;
      }
      updateTransaction({
        estimateSuggested: initTransaction
          ? defaultEstimateToUse
          : PriorityLevels.tenPercentIncreased,
        estimateUsed,
        gasLimit,
        maxFeePerGas: addTenPercentAndRound(maxFeePerGas),
        maxPriorityFeePerGas: addTenPercentAndRound(newMaxPriorityFeePerGas),
      });
    },
    [defaultEstimateToUse, gasFeeEstimates, transaction, updateTransaction],
  );

  const updateTransactionUsingEstimate = useCallback(
    (gasFeeEstimateToUse) => {
      if (!gasFeeEstimates[gasFeeEstimateToUse]) {
        return;
      }
      const { suggestedMaxFeePerGas, suggestedMaxPriorityFeePerGas } =
        gasFeeEstimates[gasFeeEstimateToUse];
      updateTransaction({
        estimateUsed: gasFeeEstimateToUse,
        maxFeePerGas: decGWEIToHexWEI(suggestedMaxFeePerGas),
        maxPriorityFeePerGas: decGWEIToHexWEI(suggestedMaxPriorityFeePerGas),
      });
    },
    [gasFeeEstimates, updateTransaction],
  );

  const updateTransactionUsingDAPPSuggestedValues = useCallback(() => {
    const { maxFeePerGas, maxPriorityFeePerGas } =
      transaction?.dappSuggestedGasFees ?? {};
    updateTransaction({
      estimateUsed: PriorityLevels.dAppSuggested,
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
