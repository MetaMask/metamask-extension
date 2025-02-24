import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TransactionType,
  type TransactionMeta,
  type FeeMarketGasFeeEstimates,
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

function getMaxFeePerGas(transactionMeta: TransactionMeta): Hex {
  const isCustomEstimateUsed = transactionMeta.estimateUsed;

  // Temporarily medium estimate is used - this will be adjusted depending on the failed transaction metrics later
  const { gasFeeEstimates } = transactionMeta;
  // TODO: Remove this once transactionMeta.txParams.maxFeePerGas is updated properly if no custom estimation is used
  let maxFeePerGas =
    (gasFeeEstimates as FeeMarketGasFeeEstimates)?.medium?.maxFeePerGas ||
    (gasFeeEstimates as LegacyGasFeeEstimates)?.medium ||
    (gasFeeEstimates as GasPriceGasFeeEstimates)?.gasPrice;

  if (isCustomEstimateUsed) {
    // If custom estimation is used, the maxFeePerGas is updated in the transactionMeta.txParams.maxFeePerGas
    maxFeePerGas = transactionMeta.txParams.maxFeePerGas as Hex;
  }

  return maxFeePerGas;
}

// This hook is used to refresh the max value of the transaction
// when the user is in max amount mode only for the transaction type simpleSend
// It subtracts the native fee from the balance and updates the value of the transaction
export const useMaxValueRefresher = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const dispatch = useDispatch();
  const { id: transactionId } = transactionMeta;
  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);
  const gasLimit = transactionMeta?.txParams?.gas || HEX_ZERO;
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
