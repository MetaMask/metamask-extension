import { TransactionType } from '@metamask/transaction-controller';
import { bytesToHex, type Hex } from '@metamask/utils';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { parse as uuidParse, v4 as uuidv4 } from 'uuid';
import {
  openMoneyFtue,
  selectHasSeenMoneyFtue,
  type MoneyFtueOrigin,
} from '../../ducks/money-ftue';
import { MoneyFtueEntryPoint } from '../../pages/money/constants/money-events';
import {
  selectMoneyFundingAccount,
  type MoneyFundingAccountState,
} from '../../selectors/money/money-funding-account';
import {
  clearMoneyAccountDepositIntent,
  setMoneyAccountDepositIntent,
  type MoneyAccountDepositIntent,
} from '../../helpers/money/deposit-intent';
import {
  ConfirmationLoader,
  useConfirmationNavigation,
} from '../../pages/confirmations/hooks/useConfirmationNavigation';
import type { SetPayTokenRequest } from '../../pages/confirmations/hooks/pay/types';
import { selectIsPayHardwareEnabled } from '../../pages/confirmations/selectors/feature-flags';
import { createMoneyAccountDepositTransaction } from '../../store/controller-actions/transaction-pay-controller';
import { useDispatch } from '../../store/hooks';
import { useMoneyErrorReporter } from './useMoneyErrorReporter';

export type InitiateDepositOptions = {
  /**
   * The explicit funding intent (`card` / `addMusd`). Generic deposits leave
   * it unset so consumers derive the intent from the transaction's actual
   * payment method instead of a guess.
   */
  intent?: MoneyAccountDepositIntent;
  /**
   * Token to pre-select as the source of funds.
   */
  preferredPaymentToken?: SetPayTokenRequest;
  /**
   * Internal: set only by the Money FTUE splash after the user has
   * acknowledged it, so continuing the pending deposit does not re-open the
   * splash.
   */
  skipFtue?: boolean;
  /**
   * Where the user came from, used only when this deposit opens the splash.
   */
  ftueOrigin?: MoneyFtueOrigin;
  /**
   * Replace the current page with the confirmation instead of pushing it,
   * for entry points that should not be returned to (e.g. the deeplink
   * bridge).
   */
  replaceConfirmation?: boolean;
  /**
   * Route to show when the confirmation closes. Defaults to the current
   * location.
   */
  goBackTo?: string;
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

// Shared across hook instances: several entry points can be on screen at once
// (e.g. the token details banner and balance CTA), and each would otherwise
// create its own placeholder batch on rapid clicks.
let isDepositInitiationInFlight = false;

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
 * The funding account is resolved by `selectMoneyFundingAccount`: the globally
 * selected account when it is eligible, otherwise the EVM account of the
 * selected account group (a non-EVM network filter switches the selected
 * account to e.g. a Solana account, but the group still holds the EVM
 * account the user expects), otherwise the user's first eligible EVM
 * account. Hardware accounts are eligible only when
 * `confirmations_pay_hardware` enables Money Account deposits; otherwise a
 * user on a hardware wallet funds from their first eligible account rather
 * than being blocked at the confirmation. Fails fast only when no eligible
 * account exists. That address is passed as Pay's `accountOverride` so
 * the confirmation defaults the From row — and quotes — to that account instead of
 * the money account that executes the batch.
 *
 * The current location is passed as `goBackTo` (unless overridden) so
 * closing the confirmation returns the user to the surface they started from
 * (e.g. the Money home) rather than the global wallet home.
 *
 * Setup failures are reported to Sentry and shown as a toast inside this
 * hook, matching mobile. The promise resolves after that so callers do not
 * each need a `.catch`; it resolves to whether the confirmation was opened. There is no navigation to roll back on failure
 * (the extension navigates after creation) and no user-rejection path at
 * initiation (rejection happens later, inside the confirmation).
 *
 * @returns The initiator and its loading state.
 */
export function useMoneyAccountDeposit() {
  const { navigateToTransaction } = useConfirmationNavigation();
  const location = useLocation();
  const dispatch = useDispatch();
  const hasSeenFtue = useSelector(selectHasSeenMoneyFtue);
  const isHardwareFundingEnabled = useSelector((state) =>
    selectIsPayHardwareEnabled(state, TransactionType.moneyAccountDeposit),
  );
  const fundingAccount = useSelector((state: MoneyFundingAccountState) =>
    selectMoneyFundingAccount(state, isHardwareFundingEnabled),
  );
  const reportError = useMoneyErrorReporter();
  const [isLoading, setIsLoading] = useState(false);

  const initiateDeposit = useCallback(
    async (options?: InitiateDepositOptions): Promise<boolean> => {
      if (isDepositInitiationInFlight) {
        return false;
      }

      if (!hasSeenFtue && !options?.skipFtue) {
        dispatch(
          openMoneyFtue({
            source: 'deposit',
            origin: options?.ftueOrigin ?? {
              entryPoint: MoneyFtueEntryPoint.Unknown,
            },
            preferredPaymentToken: options?.preferredPaymentToken,
            intent: options?.intent,
          }),
        );
        return false;
      }

      const batchId = bytesToHex(new Uint8Array(uuidParse(uuidv4())));

      // Recorded before the async work so the intent exists by the time any
      // consumer (pipeline gate, confirmation, toasts) can see the batch.
      if (options?.intent) {
        setMoneyAccountDepositIntent(batchId, options.intent);
      }

      isDepositInitiationInFlight = true;
      setIsLoading(true);
      try {
        if (!fundingAccount) {
          throw new Error('[Money Account] Missing funding EVM account');
        }

        const { transactionId } = await createMoneyAccountDepositTransaction(
          batchId,
          fundingAccount.address as Hex,
        );

        navigateToTransaction(transactionId, {
          loader: ConfirmationLoader.CustomAmount,
          goBackTo: options?.goBackTo ?? location.pathname + location.search,
          preferredPaymentToken: options?.preferredPaymentToken,
          replace: options?.replaceConfirmation,
        });
        return true;
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
        return false;
      } finally {
        isDepositInitiationInFlight = false;
        setIsLoading(false);
      }
    },
    [
      dispatch,
      fundingAccount,
      hasSeenFtue,
      location.pathname,
      location.search,
      navigateToTransaction,
      reportError,
    ],
  );

  return { initiateDeposit, isLoading };
}
