import { useCallback, useMemo } from 'react';
import {
  GasFeeEstimateType,
  GasFeeEstimateLevel,
  TransactionEnvelopeType,
  type TransactionMeta,
  UserFeeLevel as UserFeeLevelType,
} from '@metamask/transaction-controller';
import { useFeeCalculations } from '../../components/confirm/info/hooks/useFeeCalculations';
import {
  EMPTY_VALUE_STRING,
  GasModalType,
  GasOptionIcon,
} from '../../constants/gas';
import { type GasOption } from '../../types/gas';
import { useConfirmContext } from '../../context/confirm';
// import { useI18nContext } from '../../../../hooks/useI18nContext';

const HEX_ZERO = '0x0';

export const useAdvancedGasFeeOption = ({
  setActiveModal,
}: {
  setActiveModal: (modal: GasModalType) => void;
}): GasOption[] => {
  // const t = useI18nContext();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const {
    gasFeeEstimates: transactionGasFeeEstimates,
    userFeeLevel,
    txParams: {
      type: transactionEnvelopeType,
      gas: txParamsGas,
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasPrice: txParamsGasPrice,
    },
  } = transactionMeta;

  const { calculateGasEstimate } = useFeeCalculations(transactionMeta);

  const onAdvancedGasFeeClick = useCallback(() => {
    const newModalType =
      transactionEnvelopeType === TransactionEnvelopeType.legacy
        ? GasModalType.AdvancedGasPriceModal
        : GasModalType.AdvancedEIP1559Modal;

    setActiveModal(newModalType);
  }, [transactionEnvelopeType, setActiveModal]);

  const isCustomUserFeeLevelSelected = userFeeLevel === UserFeeLevelType.CUSTOM;

  const isDappSuggestedGasFeeSelected =
    userFeeLevel === UserFeeLevelType.DAPP_SUGGESTED;
  const isAnyGasFeeEstimateLevelSelected = useMemo(
    () =>
      Object.values(GasFeeEstimateLevel).some(
        (level) => userFeeLevel === level,
      ),
    [userFeeLevel],
  );

  const isGasPriceEstimateSelected = useMemo(
    () =>
      userFeeLevel === 'medium' &&
      transactionGasFeeEstimates?.type === GasFeeEstimateType.GasPrice,
    [userFeeLevel, transactionGasFeeEstimates],
  );

  const isAdvancedGasFeeSelected = useMemo(
    () =>
      (!isDappSuggestedGasFeeSelected &&
        !isAnyGasFeeEstimateLevelSelected &&
        !isGasPriceEstimateSelected) ||
      isCustomUserFeeLevelSelected,
    [
      isDappSuggestedGasFeeSelected,
      isAnyGasFeeEstimateLevelSelected,
      isGasPriceEstimateSelected,
      isCustomUserFeeLevelSelected,
    ],
  );

  let value = EMPTY_VALUE_STRING;
  let valueInFiat = EMPTY_VALUE_STRING;

  if (isAdvancedGasFeeSelected) {
    const feePerGas = maxFeePerGas || HEX_ZERO;
    let gasPrice = HEX_ZERO;
    let gas = transactionMeta.gasLimitNoBuffer || HEX_ZERO;
    let shouldUseEIP1559FeeLogic = true;
    const priorityFeePerGas = maxPriorityFeePerGas || HEX_ZERO;

    if (transactionEnvelopeType === TransactionEnvelopeType.legacy) {
      gasPrice = txParamsGasPrice || HEX_ZERO;
      gas = txParamsGas || HEX_ZERO;
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

    value = preciseNativeCurrencyFee || EMPTY_VALUE_STRING;
    valueInFiat = currentCurrencyFee || EMPTY_VALUE_STRING;
  }

  const memoizedGasOption = useMemo(
    () => [
      {
        emoji: GasOptionIcon.Advanced,
        estimatedTime: '',
        isSelected: isAdvancedGasFeeSelected,
        key: 'advanced',
        // name: t('transactions.gas_modal.advanced'),
        name: 'Advanced',
        onSelect: onAdvancedGasFeeClick,
        value,
        valueInFiat,
      },
    ],
    [isAdvancedGasFeeSelected, onAdvancedGasFeeClick, value, valueInFiat],
  );

  return memoizedGasOption;
};
