import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { getSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import { isEqualCaseInsensitive } from '../../../shared/lib/string-utils';
import { hasTransactionType } from '../../../shared/lib/transactions.utils';
import {
  selectTransactions,
  type TransactionState,
} from '../../selectors/transactionController';
import { transformWalletPerpsWithdrawalsToTransactions } from '../../components/app/perps/utils/transactionTransforms';
import type { PerpsTransaction } from '../../components/app/perps/types';

const PERPS_WITHDRAWAL_TRANSACTION_TYPES = [TransactionType.perpsWithdraw];

/**
 * Surfaces the active account's Perps withdrawal transactions tracked
 * locally by the TransactionController, transformed into `PerpsTransaction`
 * rows.
 *
 * See `transformWalletPerpsWithdrawalsToTransactions` for why this fallback
 * is needed: HyperLiquid's user-history ledger can lag behind the wallet's
 * own on-chain withdrawal confirmation.
 */
export function useWalletPerpsWithdrawalTransactions(): PerpsTransaction[] {
  const transactions = useSelector((state: TransactionState) =>
    selectTransactions(state),
  );
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const selectedAddress = selectedAccount?.address;

  return useMemo(() => {
    if (!selectedAddress) {
      return [];
    }

    const withdrawalTransactions = transactions.filter(
      (tx) =>
        hasTransactionType(tx, PERPS_WITHDRAWAL_TRANSACTION_TYPES) &&
        isEqualCaseInsensitive(tx.txParams?.from ?? '', selectedAddress),
    );

    return transformWalletPerpsWithdrawalsToTransactions(
      withdrawalTransactions,
    );
  }, [transactions, selectedAddress]);
}
