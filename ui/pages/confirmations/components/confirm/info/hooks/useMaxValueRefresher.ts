import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  TransactionType,
  type TransactionMeta,
} from '@metamask/transaction-controller';
import { add0x } from '@metamask/utils';

import {
  getSelectedAccountCachedBalance,
  selectMaxValueModeForTransaction,
} from '../../../../../../selectors';
import { subtractHexes } from '../../../../../../../shared/modules/conversion.utils';
import { updateEditableParams } from '../../../../../../store/actions';
import { useConfirmContext } from '../../../../context/confirm';
import { useFeeCalculations } from './useFeeCalculations';

// This hook is used to refresh the max value of the transaction
// when the user is in max amount mode only for the transaction type simpleSend
// It subtracts the native fee from the balance and updates the value of the transaction
export const useMaxValueRefresher = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const dispatch = useDispatch();
  const { preciseNativeFeeInHex } = useFeeCalculations(transactionMeta);
  const balance = useSelector(getSelectedAccountCachedBalance);
  const isMaxAmountMode = useSelector((state) =>
    selectMaxValueModeForTransaction(state, transactionMeta?.id),
  );

  useEffect(() => {
    if (
      !isMaxAmountMode ||
      transactionMeta.type !== TransactionType.simpleSend
    ) {
      return;
    }

    const newValue = subtractHexes(balance, preciseNativeFeeInHex);
    const newValueInHex = add0x(newValue);

    dispatch(
      updateEditableParams(transactionMeta.id, { value: newValueInHex }),
    );
  }, [isMaxAmountMode, balance, preciseNativeFeeInHex]);
};
