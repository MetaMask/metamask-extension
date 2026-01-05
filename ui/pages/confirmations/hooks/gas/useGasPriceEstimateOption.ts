import { useCallback, useMemo } from 'react';
import {
  GasFeeEstimateType,
  TransactionEnvelopeType,
  type TransactionMeta,
  type GasPriceGasFeeEstimates,
} from '@metamask/transaction-controller';
import { type GasFeeEstimates } from '@metamask/gas-fee-controller';
import { useDispatch } from 'react-redux';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { updateTransactionGasFees } from '../../../../store/actions';
import { useConfirmContext } from '../../context/confirm';
import { useGasFeeEstimates } from '../../../../hooks/useGasFeeEstimates';
import { useFeeCalculations } from '../../components/confirm/info/hooks/useFeeCalculations';
import { type GasOption } from '../../types/gas';
import { EMPTY_VALUE_STRING } from '../../constants/gas';
import { useTransactionNativeTicker } from '../transactions/useTransactionNativeTicker';
import { hexWEIToDecGWEI } from '../../../../../shared/modules/conversion.utils';

const HEX_ZERO = '0x0';

export const useGasPriceEstimateOption = ({
  handleCloseModals,
}: {
  handleCloseModals: () => void;
}): GasOption[] => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { calculateGasEstimate } = useFeeCalculations(transactionMeta);
  const nativeTicker = useTransactionNativeTicker();

  const {
    gasFeeEstimates,
    id,
    networkClientId,
    userFeeLevel,
    txParams: { type: transactionEnvelopeType },
  } = transactionMeta;

  const { gasFeeEstimates: networkGasFeeEstimates } = useGasFeeEstimates(
    networkClientId,
  ) as {
    gasFeeEstimates: GasFeeEstimates;
  };

  const transactionGasFeeEstimates = gasFeeEstimates as GasPriceGasFeeEstimates;

  const isGasPriceEstimateSelected = useMemo(
    () =>
      userFeeLevel === 'medium' &&
      transactionGasFeeEstimates?.type === GasFeeEstimateType.GasPrice,
    [userFeeLevel, transactionGasFeeEstimates],
  );

  const shouldIncludeGasPriceEstimateOption = useMemo(
    () =>
      transactionGasFeeEstimates?.type === GasFeeEstimateType.GasPrice &&
      networkGasFeeEstimates,
    [transactionGasFeeEstimates, networkGasFeeEstimates],
  );

  const onGasPriceEstimateLevelClick = useCallback(async () => {
    let gasPropertiesToUpdate;
    if (transactionEnvelopeType === TransactionEnvelopeType.legacy) {
      gasPropertiesToUpdate = {
        gasPrice: transactionGasFeeEstimates?.gasPrice,
      };
    } else {
      gasPropertiesToUpdate = {
        maxFeePerGas: transactionGasFeeEstimates?.gasPrice,
        maxPriorityFeePerGas: transactionGasFeeEstimates?.gasPrice,
      };
    }

    await dispatch(
      updateTransactionGasFees(id, {
        userFeeLevel: 'medium',
        ...gasPropertiesToUpdate,
      }),
    );
    handleCloseModals();
  }, [
    id,
    transactionGasFeeEstimates,
    transactionEnvelopeType,
    handleCloseModals,
    dispatch,
  ]);

  const options = useMemo((): GasOption[] => {
    if (!shouldIncludeGasPriceEstimateOption) {
      return [];
    }

    let feePerGas = HEX_ZERO;
    let gasPrice = HEX_ZERO;
    const gas = transactionMeta.gasLimitNoBuffer || HEX_ZERO;
    let shouldUseEIP1559FeeLogic = false;
    let priorityFeePerGas = HEX_ZERO;

    if (transactionEnvelopeType === TransactionEnvelopeType.legacy) {
      gasPrice = transactionGasFeeEstimates?.gasPrice;
    } else {
      feePerGas = transactionGasFeeEstimates?.gasPrice;
      priorityFeePerGas = transactionGasFeeEstimates?.gasPrice;
      shouldUseEIP1559FeeLogic = true;
    }

    const { currentCurrencyFee, preciseNativeCurrencyFee } =
      calculateGasEstimate({
        feePerGas,
        priorityFeePerGas,
        gas,
        shouldUseEIP1559FeeLogic,
        gasPrice,
      });

    return [
      {
        estimatedTime: undefined,
        isSelected: isGasPriceEstimateSelected,
        key: 'gasPrice',
        name: t('networkSuggested'),
        onSelect: () => onGasPriceEstimateLevelClick(),
        value: preciseNativeCurrencyFee
          ? `${preciseNativeCurrencyFee} ${nativeTicker}`
          : EMPTY_VALUE_STRING,
        valueInFiat: currentCurrencyFee || EMPTY_VALUE_STRING,
        tooltipProps: {
          priorityLevel: 'medium',
          maxFeePerGas: hexWEIToDecGWEI(feePerGas),
          maxPriorityFeePerGas: hexWEIToDecGWEI(priorityFeePerGas),
          gasLimit: parseInt(gas, 16),
          transaction: transactionMeta as unknown as Record<string, unknown>,
        },
      },
    ];
  }, [
    shouldIncludeGasPriceEstimateOption,
    transactionMeta,
    transactionEnvelopeType,
    transactionGasFeeEstimates?.gasPrice,
    calculateGasEstimate,
    isGasPriceEstimateSelected,
    onGasPriceEstimateLevelClick,
    t,
    nativeTicker,
  ]);

  return options;
};
