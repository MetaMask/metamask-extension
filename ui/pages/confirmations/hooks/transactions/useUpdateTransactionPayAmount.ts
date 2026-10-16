import { useCallback, useMemo } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { useConfirmContext } from '../../context/confirm';
import { getSupportedTransactionType } from '../../utils/transaction-pay';
import {
  updateMoneyAccountDepositAmount,
  updateMoneyAccountWithdrawAmount,
} from '../../../../store/controller-actions/transaction-pay-controller';
import { useUpdateTokenAmount } from './useUpdateTokenAmount';
import { useTransactionAccountOverride } from './useTransactionAccountOverride';

export function useUpdateTransactionPayAmount() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();
  const { updateTokenAmount } = useUpdateTokenAmount();
  const accountOverride = useTransactionAccountOverride();
  const transactionId = useMemo(
    () => transactionMeta?.id ?? '',
    [transactionMeta?.id],
  );
  const transactionType = getSupportedTransactionType(transactionMeta);

  const updateTransactionPayAmount = useCallback(
    (amountHuman: string) => {
      if (transactionType === TransactionType.moneyAccountDeposit) {
        return updateMoneyAccountDepositAmount(
          transactionId,
          amountHuman,
        ).catch((error) => {
          console.error('Failed to update money account deposit amount', error);
        });
      }
      if (transactionType === TransactionType.moneyAccountWithdraw) {
        return updateMoneyAccountWithdrawAmount(
          transactionId,
          amountHuman,
          accountOverride,
        ).catch((error) => {
          console.error(
            'Failed to update money account withdrawal amount',
            error,
          );
        });
      }
      return updateTokenAmount(amountHuman);
    },
    [transactionType, transactionId, accountOverride, updateTokenAmount],
  );

  return {
    isUpdating: false,
    updateTokenAmount: updateTransactionPayAmount,
  };
}
