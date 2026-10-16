import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { hasTransactionType } from '../../../../../shared/lib/transactions.utils';
import {
  updateMoneyAccountDepositAmount,
  updateMoneyAccountWithdrawAmount,
} from '../../../../store/controller-actions/transaction-pay-controller';
import { useTransactionMetadataRequest } from './useTransactionMetadataRequest';
import { useUpdateTokenAmount } from './useUpdateTokenAmount';
import { useTransactionAccountOverride } from './useTransactionAccountOverride';

export function useUpdateTransactionPayAmount() {
  const transactionMeta = useTransactionMetadataRequest();
  const { updateTokenAmount } = useUpdateTokenAmount();
  const accountOverride = useTransactionAccountOverride();
  const transactionId = useMemo(
    () => transactionMeta?.id ?? '',
    [transactionMeta?.id],
  );
  const latestAmountRef = useRef<string>('');
  const transactionMetaRef = useRef(transactionMeta);
  const accountOverrideRef = useRef(accountOverride);

  useEffect(() => {
    transactionMetaRef.current = transactionMeta;
    accountOverrideRef.current = accountOverride;
  }, [transactionMeta, accountOverride]);

  const updateTransactionPayAmount = useCallback(
    (amountHuman: string) => {
      latestAmountRef.current = amountHuman;
      if (
        hasTransactionType(transactionMetaRef.current, [
          TransactionType.moneyAccountDeposit,
        ])
      ) {
        return updateMoneyAccountDepositAmount(
          transactionId,
          amountHuman,
        ).catch((error) => {
          if (latestAmountRef.current === amountHuman) {
            console.error(
              'Failed to update money account deposit amount',
              error,
            );
          }
        });
      }
      if (
        hasTransactionType(transactionMetaRef.current, [
          TransactionType.moneyAccountWithdraw,
        ])
      ) {
        return updateMoneyAccountWithdrawAmount(
          transactionId,
          amountHuman,
          accountOverrideRef.current,
        ).catch((error) => {
          if (latestAmountRef.current === amountHuman) {
            console.error(
              'Failed to update money account withdrawal amount',
              error,
            );
          }
        });
      }
      return updateTokenAmount(amountHuman);
    },
    [transactionId, updateTokenAmount],
  );

  return {
    isUpdating: false,
    updateTokenAmount: updateTransactionPayAmount,
  };
}
