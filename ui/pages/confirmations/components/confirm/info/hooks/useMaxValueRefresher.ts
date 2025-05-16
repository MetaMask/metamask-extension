import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  GasFeeEstimateLevel,
  TransactionType,
  UserFeeLevel,
  type TransactionMeta,
  type FeeMarketGasFeeEstimates,
  type GasFeeEstimates,
  type GasPriceGasFeeEstimates,
  type LegacyGasFeeEstimates,
} from '@metamask/transaction-controller';
import { add0x, Hex } from '@metamask/utils';

import {
  getSelectedAccountCachedBalance,
  selectMaxValueModeForTransaction,
} from '../../../../../../selectors';
import {
  decimalToHex,
  multiplyHexes,
  subtractHexes,
} from '../../../../../../../shared/modules/conversion.utils';
import { updateEditableParams } from '../../../../../../store/actions';
import { useConfirmContext } from '../../../../context/confirm';
import { HEX_ZERO } from '../shared/constants';
import { useTransactionEventFragment } from '../../../../hooks/useTransactionEventFragment';
import { useSupportsEIP1559 } from './useSupportsEIP1559';

// This hook is used to refresh the max value of the transaction
// when the user is in max amount mode only for the transaction type simpleSend
// It subtracts the native fee from the balance and updates the value of the transaction
export const useMaxValueRefresher = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const dispatch = useDispatch();
  const { id: transactionId } = transactionMeta;
  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const gasLimit = transactionMeta?.txParams?.gas || HEX_ZERO;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const gasPrice = transactionMeta?.txParams?.gasPrice || HEX_ZERO;
  const balance = useSelector(getSelectedAccountCachedBalance);
  const isMaxAmountMode = useSelector((state) =>
    selectMaxValueModeForTransaction(state, transactionMeta?.id),
  );
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const maxFeePerGas = getMaxFeePerGas(transactionMeta);
  const maxFee = useMemo(() => {
    return multiplyHexes(
      supportsEIP1559 ? (decimalToHex(maxFeePerGas) as Hex) : (gasPrice as Hex),
      gasLimit as Hex,
    );
  }, [supportsEIP1559, maxFeePerGas, gasLimit, gasPrice]);

  useEffect(() => {
    updateTransactionEventFragment(
      {
        properties: {
          is_send_max: isMaxAmountMode,
        },
      },
      transactionId,
    );
  }, [isMaxAmountMode, transactionId]);

  useEffect(() => {
    if (
      !isMaxAmountMode ||
      transactionMeta.type !== TransactionType.simpleSend
    ) {
      return;
    }

    const newValue = subtractHexes(balance, maxFee);
    const newValueInHex = add0x(newValue);

    dispatch(
      updateEditableParams(transactionMeta.id, { value: newValueInHex }),
    );
  }, [isMaxAmountMode, balance, maxFee]);
};

function getMaxFeePerGas(transactionMeta: TransactionMeta): Hex {
  const { gasFeeEstimates, userFeeLevel } = transactionMeta;

  // Temporarily medium estimate is used - this will be adjusted depending on the failed transaction metrics later
  let maxFeePerGas = getMaxFeePerGasFromGasFeeEstimates(
    gasFeeEstimates as GasFeeEstimates,
    GasFeeEstimateLevel.Medium,
  );

  // If custom estimation is used, the maxFeePerGas is updated in the transactionMeta.txParams.maxFeePerGas
  if (userFeeLevel === UserFeeLevel.CUSTOM) {
    maxFeePerGas = transactionMeta.txParams.maxFeePerGas as Hex;
  }

  // TODO: Remove this once transactionMeta.txParams.maxFeePerGas is updated properly with
  // given userFeeLevel then use transactionMeta.txParams.maxFeePerGas
  // https://github.com/MetaMask/MetaMask-planning/issues/4287
  if (
    Object.values(GasFeeEstimateLevel).includes(
      userFeeLevel as GasFeeEstimateLevel,
    )
  ) {
    maxFeePerGas = getMaxFeePerGasFromGasFeeEstimates(
      gasFeeEstimates as GasFeeEstimates,
      userFeeLevel as GasFeeEstimateLevel,
    );
  }

  return maxFeePerGas;
}

function getMaxFeePerGasFromGasFeeEstimates(
  gasFeeEstimates: GasFeeEstimates,
  userFeeLevel: GasFeeEstimateLevel,
): Hex {
  return ((gasFeeEstimates as FeeMarketGasFeeEstimates)?.[userFeeLevel]
    ?.maxFeePerGas ||
    (gasFeeEstimates as LegacyGasFeeEstimates)?.[userFeeLevel] ||
    (gasFeeEstimates as GasPriceGasFeeEstimates)?.gasPrice) as Hex;
}
