import { useSyncExternalStore } from 'react';
import {
  getLastMoneyAccountDepositAmount,
  subscribeLastMoneyAccountDepositAmount,
} from '../../../../store/controller-actions/transaction-pay-controller';

/**
 * Last human-readable deposit amount recorded for this confirmation.
 * Reactive so the footer can ignore a stale Max quote as soon as the user types.
 *
 * @param transactionId - Id of the Money Account deposit transaction.
 * @returns The last amount, if any update has been recorded.
 */
export function useLastMoneyAccountDepositAmount(
  transactionId: string,
): string | undefined {
  return useSyncExternalStore(subscribeLastMoneyAccountDepositAmount, () =>
    getLastMoneyAccountDepositAmount(transactionId),
  );
}
