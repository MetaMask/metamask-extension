import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';

import {
  getSelectedAccountCachedBalance,
  selectMaxValueModeForTransaction,
} from '../../../../../../selectors';
import {
  addHexes,
  multiplyHexes,
} from '../../../../../../../shared/modules/conversion.utils';
import { Numeric } from '../../../../../../../shared/modules/Numeric';
import { updateEditableParams } from '../../../../../../store/actions';
import { useConfirmContext } from '../../../../context/confirm';
import { HEX_ZERO } from '../shared/constants';
import { useTransactionEventFragment } from '../../../../hooks/useTransactionEventFragment';
import { useSupportsEIP1559 } from './useSupportsEIP1559';

/**
 * A hook that automatically refreshes the transaction value when the user is in "max amount" mode.
 *
 * This hook monitors the transaction state and recalculates the maximum sendable amount by subtracting
 * the estimated gas fees from the account balance. It only operates on `simpleSend` transaction types
 * when max amount mode is enabled.
 *
 * - Only affects transactions of type `TransactionType.simpleSend`
 * - Supports both legacy gas pricing and EIP-1559 fee structures
 * - Handles Layer 1 gas fees for Layer 2 network transactions
 * - Does not update the value if the remaining balance would be negative or zero
 *
 * @requires useConfirmContext - Must be used within a confirmation context
 * @requires Redux store - Requires access to account balance and transaction state
 */
export const useMaxValueRefresher = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const dispatch = useDispatch();
  const { id: transactionId } = transactionMeta;
  const isMaxAmountMode = useSelector((state) =>
    selectMaxValueModeForTransaction(state, transactionMeta?.id),
  );
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const balance = useSelector(getSelectedAccountCachedBalance);
  const { supportsEIP1559 } = useSupportsEIP1559(transactionMeta);
  const gas = (transactionMeta.txParams.gas as Hex) || HEX_ZERO;
  const gasPrice = (transactionMeta.txParams.gasPrice as Hex) || HEX_ZERO;
  const maxFeePerGas =
    (transactionMeta.txParams.maxFeePerGas as Hex) || HEX_ZERO;
  const layer1GasFee = transactionMeta.layer1GasFee as Hex;

  useEffect(() => {
    updateTransactionEventFragment(
      {
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
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

    let gasFeeInHex = multiplyHexes(
      gas,
      supportsEIP1559 ? maxFeePerGas : gasPrice,
    );

    if (layer1GasFee) {
      gasFeeInHex = addHexes(gasFeeInHex, layer1GasFee) as Hex;
    }

    const remainingBalance = new Numeric(balance || HEX_ZERO, 16).minus(
      new Numeric(gasFeeInHex, 16),
    );

    // If the remaining balance is negative or zero, do nothing
    if (remainingBalance.isNegative() || remainingBalance.isZero()) {
      return;
    }

    dispatch(
      updateEditableParams(transactionMeta.id, {
        value: remainingBalance.toPrefixedHexString(),
      }),
    );
  }, [
    isMaxAmountMode,
    balance,
    gas,
    gasPrice,
    maxFeePerGas,
    supportsEIP1559,
    layer1GasFee,
    dispatch,
    transactionMeta,
  ]);
};
