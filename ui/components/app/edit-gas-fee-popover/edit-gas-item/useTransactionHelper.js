import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import {
  decGWEIToHexWEI,
  decimalToHex,
} from '../../../../helpers/utils/conversions.util';
import { updateTransaction } from '../../../../store/actions';

export const useTransactionHelper = () => {
  const {
    defaultEstimateToUse,
    estimateToUse,
    gasLimit,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
    supportsEIP1559,
    transaction,
  } = useGasFeeContext();

  const dispatch = useDispatch();

  useEffect(() => {
    const newGasSettings = {
      gas: decimalToHex(gasLimit),
      gasLimit: decimalToHex(gasLimit),
      estimateSuggested: defaultEstimateToUse,
      estimateUsed: estimateToUse,
    };

    if (supportsEIP1559) {
      newGasSettings.maxFeePerGas = decGWEIToHexWEI(maxFeePerGas ?? gasPrice);
      newGasSettings.maxPriorityFeePerGas = decGWEIToHexWEI(
        maxPriorityFeePerGas ?? maxFeePerGas ?? gasPrice,
      );
    } else {
      newGasSettings.gasPrice = decGWEIToHexWEI(gasPrice);
    }

    const cleanTransactionParams = { ...transaction.txParams };

    if (supportsEIP1559) {
      delete cleanTransactionParams.gasPrice;
    }

    const updatedTxMeta = {
      ...transaction,
      userFeeLevel: estimateToUse || 'custom',
      txParams: {
        ...cleanTransactionParams,
        ...newGasSettings,
      },
    };

    dispatch(updateTransaction(updatedTxMeta));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimateToUse, gasPrice, maxFeePerGas, maxPriorityFeePerGas]);
  return undefined;
};
