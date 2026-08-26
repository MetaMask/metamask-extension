import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEvmAccountType } from '@metamask/keyring-api';
import { getMaybeSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../pages/confirmations/hooks/useConfirmationNavigation';
import { createMoneyAccountWithdrawTransaction } from '../../store/controller-actions/transaction-pay-controller';

export type InitiateWithdrawalOptions = {
  /** Called when withdrawal setup fails, before the error is rethrown. */
  onWithdrawalSetupFailure?: (error: Error) => void;
};

/**
 * Initiates a Money Account withdrawal: creates the placeholder withdraw +
 * transfer batch in the background (from the money account) and navigates to
 * the custom-amount confirmation, where the amount — and the recipient, the
 * user's currently selected account — are committed by
 * `updateMoneyAccountWithdrawAmount`.
 *
 * Callers must gate the entry point on `useMoneyAccountInfo`, the same rule
 * as `useMoneyAccountDeposit`. There is no deposit-intent equivalent for
 * withdrawals — mobile records none either.
 *
 * Fails fast (as mobile does) when no EVM account is selected: the recipient
 * is only committed later by `updateMoneyAccountWithdrawAmount`, so without
 * this guard the user would reach the confirmation and have every amount
 * commit fail instead.
 *
 * @returns The initiator and its loading state.
 */
export function useMoneyAccountWithdrawal() {
  const { navigateToTransaction } = useConfirmationNavigation();
  const selectedAccount = useSelector(getMaybeSelectedInternalAccount);
  const [isLoading, setIsLoading] = useState(false);

  const initiateWithdrawal = useCallback(
    async (options?: InitiateWithdrawalOptions) => {
      setIsLoading(true);
      try {
        if (!selectedAccount || !isEvmAccountType(selectedAccount.type)) {
          throw new Error('[Money Account] Missing recipient EVM address');
        }

        const { transactionId } = await createMoneyAccountWithdrawTransaction();

        navigateToTransaction(transactionId, {
          loader: ConfirmationLoader.CustomAmount,
        });
      } catch (error) {
        const errorObj =
          error instanceof Error
            ? error
            : new Error('[Money Account] Withdrawal setup failed');
        options?.onWithdrawalSetupFailure?.(errorObj);
        // Rethrow so the caller can log the failed initiation.
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [navigateToTransaction, selectedAccount],
  );

  return { initiateWithdrawal, isLoading };
}
