import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { isEvmAccountType } from '@metamask/keyring-api';
import type { Hex } from '@metamask/utils';
import { getMaybeSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../pages/confirmations/hooks/useConfirmationNavigation';
import { createMoneyAccountWithdrawTransaction } from '../../store/controller-actions/transaction-pay-controller';
import { useMoneyErrorReporter } from './useMoneyErrorReporter';

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
 * Fails fast when no eligible EVM account is selected. The selected account's
 * address is passed as Pay's `accountOverride` so the confirmation defaults
 * the From row — and the withdraw recipient — to that account instead of the
 * money account that executes the batch.
 *
 * Setup failures are reported to Sentry and shown as a toast inside this
 * hook, matching mobile. The promise resolves after that so callers do not
 * each need a `.catch`.
 *
 * @returns The initiator and its loading state.
 */
export function useMoneyAccountWithdrawal() {
  const { navigateToTransaction } = useConfirmationNavigation();
  const location = useLocation();
  const selectedAccount = useSelector(getMaybeSelectedInternalAccount);
  const reportError = useMoneyErrorReporter();
  const [isLoading, setIsLoading] = useState(false);

  const initiateWithdrawal = useCallback(async () => {
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
        goBackTo: location.pathname + location.search,
      });
    } catch (error) {
      reportError({
        error,
        message: '[Money Account] Withdrawal setup failed',
        title: 'moneyToastWithdrawFailedTitle',
        description: 'moneyToastWithdrawFailedBody',
        extra: { flow: 'withdraw' },
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    location.pathname,
    location.search,
    navigateToTransaction,
    reportError,
    selectedAccount,
  ]);

  return { initiateWithdrawal, isLoading };
}
