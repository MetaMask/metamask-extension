import { bytesToHex } from '@metamask/utils';
import { useCallback, useState } from 'react';
import { parse as uuidParse, v4 as uuidv4 } from 'uuid';
import {
  clearMoneyAccountDepositIntent,
  setMoneyAccountDepositIntent,
  type MoneyAccountDepositIntent,
} from '../../helpers/money/deposit-intent';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../pages/confirmations/hooks/useConfirmationNavigation';
import { createMoneyAccountDepositTransaction } from '../../store/controller-actions/transaction-pay-controller';

export type InitiateDepositOptions = {
  /**
   * The explicit funding intent (`card` / `addMusd`). Generic deposits leave
   * it unset so consumers derive the intent from the transaction's actual
   * payment method instead of a guess.
   */
  intent?: MoneyAccountDepositIntent;
  /** Called when deposit setup fails, before the error is rethrown. */
  onDepositSetupFailure?: (error: Error) => void;
};

/**
 * Initiates a Money Account deposit: creates the placeholder approve +
 * deposit batch in the background (from the money account, with mUSD as the
 * required asset) and navigates to the custom-amount confirmation where Pay
 * takes over.
 *
 * Callers must gate the entry point on `useMoneyAccountInfo` — an
 * unavailable money account is a thrown error here, not a rendered state,
 * because the surface is supposed to be hidden entirely.
 *
 * Two deliberate differences from mobile's hook, both consequences of the
 * extension navigating **after** creation rather than early with a skeleton:
 * there is no navigation to roll back on failure, and there is no
 * user-rejection path at initiation (rejection happens later, inside the
 * confirmation). Mobile's `preferredPaymentToken` / `autoSelectFiatPayment` /
 * `replaceConfirmation` params are confirmation-navigation features the
 * extension does not have yet.
 *
 * @returns The initiator and its loading state.
 */
export function useMoneyAccountDeposit() {
  const { navigateToTransaction } = useConfirmationNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const initiateDeposit = useCallback(
    async (options?: InitiateDepositOptions) => {
      const batchId = bytesToHex(new Uint8Array(uuidParse(uuidv4())));

      // Recorded before the async work so the intent exists by the time any
      // consumer (pipeline gate, confirmation, toasts) can see the batch.
      if (options?.intent) {
        setMoneyAccountDepositIntent(batchId, options.intent);
      }

      setIsLoading(true);
      try {
        const { transactionId } =
          await createMoneyAccountDepositTransaction(batchId);

        navigateToTransaction(transactionId, {
          loader: ConfirmationLoader.CustomAmount,
        });
      } catch (error) {
        clearMoneyAccountDepositIntent(batchId);
        const errorObj =
          error instanceof Error
            ? error
            : new Error('[Money Account] Deposit setup failed');
        options?.onDepositSetupFailure?.(errorObj);
        // Rethrow so the caller can log the failed initiation.
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [navigateToTransaction],
  );

  return { initiateDeposit, isLoading };
}
