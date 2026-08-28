import { useSyncExternalStore } from 'react';
import {
  getLastMoneyAccountWithdrawAmount,
  subscribeLastMoneyAccountWithdrawAmount,
} from '../../../../store/controller-actions/transaction-pay-controller';

/**
 * Last human-readable withdraw amount dispatched for this confirmation.
 * Reactive so the footer can enable Send without waiting on TPC required
 * tokens or quote totals.
 *
 * @param transactionId - Id of the Money Account withdrawal transaction.
 * @returns The last amount, if any update has been dispatched.
 */
export function useLastMoneyAccountWithdrawAmount(
  transactionId: string,
): string | undefined {
  return useSyncExternalStore(subscribeLastMoneyAccountWithdrawAmount, () =>
    getLastMoneyAccountWithdrawAmount(transactionId),
  );
}
