import { useCallback, useMemo } from 'react';
import {
  GasFeeEstimateType,
  GasFeeEstimateLevel,
  type TransactionMeta,
  type GasFeeEstimates as TransactionGasFeeEstimates,
} from '@metamask/transaction-controller';
import { type GasFeeEstimates } from '@metamask/gas-fee-controller';
import { useDispatch } from 'react-redux';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../context/confirm';
import { useGasFeeEstimates } from '../../../../hooks/useGasFeeEstimates';
import { useFeeCalculations } from '../../components/confirm/info/hooks/useFeeCalculations';
import { updateTransactionGasFees } from '../../../../store/actions';
import { type GasOption } from '../../types/gas';
import { EMPTY_VALUE_STRING } from '../../constants/gas';
import { toHumanEstimatedTimeRange } from '../../utils/time';
import { useTransactionNativeTicker } from '../transactions/useTransactionNativeTicker';
import { hexWEIToDecGWEI } from '../../../../../shared/modules/conversion.utils';

const HEX_ZERO = '0x0';

export const useGasFeeEstimateLevelOptions = ({
  handleCloseModals,
}: {
  handleCloseModals: () => void;
}): GasOption[] => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const nativeTicker = useTransactionNativeTicker();
  const { calculateGasEstimate } = useFeeCalculations(transactionMeta);
  const { gasFeeEstimates: networkGasFeeEstimates } = useGasFeeEstimates(
    transactionMeta.networkClientId,
  ) as {
    gasFeeEstimates: GasFeeEstimates;
  };

  const { gasFeeEstimates, id, userFeeLevel } = transactionMeta;

  const transactionGasFeeEstimates =
    gasFeeEstimates as TransactionGasFeeEstimates;

  const shouldIncludeGasFeeEstimateLevelOptions = useMemo(
    () =>
      (transactionGasFeeEstimates?.type === GasFeeEstimateType.FeeMarket ||
        transactionGasFeeEstimates?.type === GasFeeEstimateType.Legacy) &&
      networkGasFeeEstimates,
    [transactionGasFeeEstimates, networkGasFeeEstimates],
  );

  const onGasFeeEstimateLevelClick = useCallback(
    async (level: GasFeeEstimateLevel) => {
      await dispatch(
        updateTransactionGasFees(id, {
          userFeeLevel: level,
        }),
      );
      handleCloseModals();
    },
    [id, handleCloseModals, dispatch],
  );

  const options: GasOption[] = [];

  if (shouldIncludeGasFeeEstimateLevelOptions) {
    Object.values(GasFeeEstimateLevel).forEach((level) => {
      // Skip adding the high option if it has the same fees as the medium option
      if (
        level === GasFeeEstimateLevel.High &&
        transactionGasFeeEstimates?.type === GasFeeEstimateType.FeeMarket
      ) {
        const mediumEstimates =
          transactionGasFeeEstimates[GasFeeEstimateLevel.Medium];
        const highEstimates =
          transactionGasFeeEstimates[GasFeeEstimateLevel.High];

        const hasSameFees =
          mediumEstimates?.maxFeePerGas === highEstimates?.maxFeePerGas &&
          mediumEstimates?.maxPriorityFeePerGas ===
            highEstimates?.maxPriorityFeePerGas;

        if (hasSameFees) {
          return;
        }
      }

      const estimatedTime = toHumanEstimatedTimeRange(
        networkGasFeeEstimates[level].minWaitTimeEstimate,
        networkGasFeeEstimates[level].maxWaitTimeEstimate,
      );

      let feePerGas = HEX_ZERO;
      let gasPrice = HEX_ZERO;
      const gas = transactionMeta.gasLimitNoBuffer || HEX_ZERO;
      let shouldUseEIP1559FeeLogic = true;
      let priorityFeePerGas = HEX_ZERO;

      switch (transactionGasFeeEstimates?.type) {
        case GasFeeEstimateType.FeeMarket:
          feePerGas = transactionGasFeeEstimates?.[level]?.maxFeePerGas;
          priorityFeePerGas =
            transactionGasFeeEstimates?.[level]?.maxPriorityFeePerGas;
          break;
        case GasFeeEstimateType.Legacy:
          gasPrice = transactionGasFeeEstimates?.[level];
          shouldUseEIP1559FeeLogic = false;
          break;
        default:
          gasPrice = transactionGasFeeEstimates?.gasPrice;
          shouldUseEIP1559FeeLogic = false;
          break;
      }

      const { currentCurrencyFee, preciseNativeCurrencyFee } =
        calculateGasEstimate({
          feePerGas,
          priorityFeePerGas,
          gasPrice,
          gas,
          shouldUseEIP1559FeeLogic,
        });

      options.push({
        estimatedTime,
        isSelected: userFeeLevel === level,
        key: level,
        name: t(level),
        onSelect: () => onGasFeeEstimateLevelClick(level),
        value: preciseNativeCurrencyFee
          ? `${preciseNativeCurrencyFee} ${nativeTicker}`
          : EMPTY_VALUE_STRING,
        valueInFiat: currentCurrencyFee || EMPTY_VALUE_STRING,
        tooltipProps: {
          priorityLevel: level,
          maxFeePerGas: hexWEIToDecGWEI(feePerGas),
          maxPriorityFeePerGas: hexWEIToDecGWEI(priorityFeePerGas),
          gasLimit: parseInt(gas, 16),
          transaction: transactionMeta as unknown as Record<string, unknown>,
        },
      });
    });
  }

  return options;
};
