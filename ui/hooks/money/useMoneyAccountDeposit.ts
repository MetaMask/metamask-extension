import { isEvmAccountType } from '@metamask/keyring-api';
import { bytesToHex, type Hex } from '@metamask/utils';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { parse as uuidParse, v4 as uuidv4 } from 'uuid';
import { getMaybeSelectedInternalAccount } from '../../../shared/lib/selectors/accounts';
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
import { useMoneyErrorReporter } from './useMoneyErrorReporter';

export type InitiateDepositOptions = {
  /**
   * The explicit funding intent (`card` / `addMusd`). Generic deposits leave
   * it unset so consumers derive the intent from the transaction's actual
   * payment method instead of a guess.
   */
  intent?: MoneyAccountDepositIntent;
};

const DEPOSIT_FAILED_TOAST_COPY = {
  convert: {
    title: 'moneyToastDepositFailedTitleConvert',
    description: 'moneyToastDepositFailedBodyConvert',
  },
  addMusd: {
    title: 'moneyToastDepositFailedTitleAddMusd',
    description: 'moneyToastDepositFailedBody',
  },
  card: {
    title: 'moneyToastDepositFailedTitle',
    description: 'moneyToastDepositFailedBody',
  },
} as const;

/**
 * Toast copy for a failed deposit initiation.
 *
 * Mobile's `getDepositToastKeys` defaults an unset intent to `convert` because
 * post-submit toasts can still derive the payment method. At initiation there
 * is no transaction yet, and every extension initiation surface is Add funds,
 * so an unset intent uses the `addMusd` copy.
 *
 * @param intent - The explicit funding intent, if one was recorded.
 * @returns Title and description locale keys.
 */
const getDepositFailedToastCopy = (intent?: MoneyAccountDepositIntent) =>
  DEPOSIT_FAILED_TOAST_COPY[intent ?? 'addMusd'];

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
 * Fails fast when no eligible EVM account is selected. The selected account's
 * address is passed as Pay's `accountOverride` so the confirmation defaults
 * the From row — and quotes — to that account instead of the money account
 * that executes the batch.
 *
 * The current location is passed as `goBackTo` so closing the confirmation
 * returns the user to the surface they started from (e.g. the Money home)
 * rather than the global wallet home.
 *
 * Setup failures are reported to Sentry and shown as a toast inside this
 * hook, matching mobile. The promise resolves after that so callers do not
 * each need a `.catch`. There is no navigation to roll back on failure
 * (the extension navigates after creation) and no user-rejection path at
 * initiation (rejection happens later, inside the confirmation).
 *
 * @returns The initiator and its loading state.
 */
export function useMoneyAccountDeposit() {
  const { navigateToTransaction } = useConfirmationNavigation();
  const location = useLocation();
  const selectedAccount = useSelector(getMaybeSelectedInternalAccount);
  const reportError = useMoneyErrorReporter();
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
        if (!selectedAccount || !isEvmAccountType(selectedAccount.type)) {
          throw new Error('[Money Account] Missing funding EVM account');
        }

        const { transactionId } = await createMoneyAccountDepositTransaction(
          batchId,
          selectedAccount.address as Hex,
        );

        navigateToTransaction(transactionId, {
          loader: ConfirmationLoader.CustomAmount,
          goBackTo: location.pathname + location.search,
        });
      } catch (error) {
        clearMoneyAccountDepositIntent(batchId);
        const toastCopy = getDepositFailedToastCopy(options?.intent);
        reportError({
          error,
          message: '[Money Account] Deposit setup failed',
          title: toastCopy.title,
          description: toastCopy.description,
          extra: {
            flow: 'deposit',
            ...(options?.intent ? { intent: options.intent } : {}),
          },
        });
      } finally {
        setIsLoading(false);
      }
    },
    [
      location.pathname,
      location.search,
      navigateToTransaction,
      reportError,
      selectedAccount,
    ],
  );

  return { initiateDeposit, isLoading };
}
