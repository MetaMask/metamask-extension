import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { Hex } from '@metamask/utils';
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
 * Fails fast (as mobile does) when no EVM account is selected: that address
 * is passed through as Pay's `accountOverride` so the confirmation defaults
 * the From row — and the withdraw recipient — to the currently selected
 * account instead of the money account that executes the batch.
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

        const { transactionId } = await createMoneyAccountWithdrawTransaction(
          selectedAccount.address as Hex,
        );

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
