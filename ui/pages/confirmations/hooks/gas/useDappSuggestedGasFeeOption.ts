import { useCallback, useMemo } from 'react';
import {
  UserFeeLevel,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { useDispatch } from 'react-redux';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { updateTransactionGasFees } from '../../../../store/actions';
import { type GasOption } from '../../types/gas';
import { EMPTY_VALUE_STRING } from '../../constants/gas';
import { useConfirmContext } from '../../context/confirm';
import { useFeeCalculations } from '../../components/confirm/info/hooks/useFeeCalculations';
import { useTransactionNativeTicker } from '../transactions/useTransactionNativeTicker';
import { hexWEIToDecGWEI } from '../../../../../shared/modules/conversion.utils';

const HEX_ZERO = '0x0';
const MM_ORIGIN = 'metamask';

export const useDappSuggestedGasFeeOption = ({
  handleCloseModals,
}: {
  handleCloseModals: () => void;
}): GasOption[] => {
  const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const nativeTicker = useTransactionNativeTicker();
  const { calculateGasEstimate } = useFeeCalculations(transactionMeta);
  const dispatch = useDispatch();

  const { dappSuggestedGasFees, id, origin, userFeeLevel } = transactionMeta;

  const onDappSuggestedGasFeeClick = useCallback(async () => {
    await dispatch(
      updateTransactionGasFees(id, {
        userFeeLevel: UserFeeLevel.DAPP_SUGGESTED,
        ...(dappSuggestedGasFees || {}),
      }),
    );
    handleCloseModals();
  }, [id, dappSuggestedGasFees, handleCloseModals, dispatch]);

  const shouldIncludeDappSuggestedGasFeeOption = useMemo(
    () => origin !== MM_ORIGIN && dappSuggestedGasFees,
    [origin, dappSuggestedGasFees],
  );

  const isDappSuggestedGasFeeSelected =
    userFeeLevel === UserFeeLevel.DAPP_SUGGESTED;

  const options: GasOption[] = [];

  if (shouldIncludeDappSuggestedGasFeeOption) {
    let feePerGas = HEX_ZERO;
    let gasPrice = HEX_ZERO;
    let gas = transactionMeta.gasLimitNoBuffer || HEX_ZERO;
    let shouldUseEIP1559FeeLogic = true;
    let priorityFeePerGas = HEX_ZERO;

    if (
      dappSuggestedGasFees?.maxFeePerGas &&
      dappSuggestedGasFees?.maxPriorityFeePerGas
    ) {
      feePerGas = dappSuggestedGasFees?.maxFeePerGas;
      priorityFeePerGas = dappSuggestedGasFees?.maxPriorityFeePerGas;
    } else if (dappSuggestedGasFees?.gasPrice) {
      gasPrice = dappSuggestedGasFees?.gasPrice;
      gas = dappSuggestedGasFees?.gas || HEX_ZERO;
      shouldUseEIP1559FeeLogic = false;
    }

    const { currentCurrencyFee, preciseNativeCurrencyFee } =
      calculateGasEstimate({
        feePerGas,
        priorityFeePerGas,
        gas,
        shouldUseEIP1559FeeLogic,
        gasPrice,
      });

    options.push({
      estimatedTime: undefined,
      isSelected: isDappSuggestedGasFeeSelected,
      key: 'site_suggested',
      name: t('dappSuggested'),
      onSelect: onDappSuggestedGasFeeClick,
      value: preciseNativeCurrencyFee
        ? `${preciseNativeCurrencyFee} ${nativeTicker}`
        : EMPTY_VALUE_STRING,
      valueInFiat: currentCurrencyFee || EMPTY_VALUE_STRING,
      tooltipProps: {
        priorityLevel: 'dappSuggested',
        maxFeePerGas: hexWEIToDecGWEI(feePerGas),
        maxPriorityFeePerGas: hexWEIToDecGWEI(priorityFeePerGas),
        gasLimit: parseInt(gas, 16),
        transaction: transactionMeta as unknown as Record<string, unknown>,
      },
    });
  }

  return options;
};
