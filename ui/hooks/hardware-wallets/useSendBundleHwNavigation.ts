import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';

import { isHardwareWallet } from '../../../shared/lib/selectors/keyring';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { useBridgeNavigation } from '../bridge/useBridgeNavigation';
import { BUNDLE_SEND_TRANSACTION_TYPES } from './hw-sign-tracker/constants';
import { useSendBundleAmountSymbol } from './useSendBundleAmountSymbol';

export type UseSendBundleHwNavigationArgs = {
  transactionMeta: TransactionMeta | undefined;
};

/**
 * Determines whether the current send transaction should redirect to the
 * hardware-wallet signing page (sendBundle flow), and performs the redirect.
 *
 * Redirects when the current account is a hardware wallet and the transaction
 * type is a bundle send type (fungible sends only; contract interactions go
 * through the bridge flow). Applies to all hardware-wallet sends regardless of
 * Smart Transactions (STX) / gasless support.
 *
 * transactionMeta is the only injected input; the send amount/symbol are
 * derived internally via useSendBundleAmountSymbol, keeping this hook free of
 * confirmations route dependencies (ADR 0021).
 *
 * @param options0
 * @param options0.transactionMeta
 * @returns shouldRedirectToHwSigningPage - boolean for use in conditionals;
 * redirectToHwSigningPage(newTransactionMeta) - performs the navigation (call
 * only when shouldRedirectToHwSigningPage is true).
 */
export function useSendBundleHwNavigation({
  transactionMeta,
}: UseSendBundleHwNavigationArgs) {
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const { navigateToHwSigningPage } = useBridgeNavigation();
  // Derive the send amount/symbol internally so the HW signing page label
  // matches what the user saw on the send screen.
  const { sendAmount, sendSymbol, gasSymbol } =
    useSendBundleAmountSymbol(transactionMeta);

  const transactionType = transactionMeta?.type;
  const shouldRedirectToHwSigningPage =
    Boolean(hardwareWalletUsed) &&
    transactionType !== undefined &&
    BUNDLE_SEND_TRANSACTION_TYPES.has(transactionType);

  const redirectToHwSigningPage = useCallback(
    (newTransactionMeta: TransactionMeta) => {
      navigateToHwSigningPage({
        bridgeState: null,
        token: null,
        sendBundle: {
          txMeta: newTransactionMeta,
          needsTwoConfirmations: Boolean(
            newTransactionMeta.batchTransactions?.length,
          ),
          // Wallet-safety: the signing page refuses to submit unless this id
          // is still pending. Prevents signing a stale txMeta.
          approvalRequestId: String(transactionMeta?.id),
          sendAmount,
          sendSymbol,
          gasSymbol,
          // Landing on Home after the HW signing flow keeps the back button
          // working (back to Home) instead of getting stuck on the stale send
          // page where back only returns to the signing/confirmation entries.
          returnRoute: DEFAULT_ROUTE,
        },
      });
    },
    [
      navigateToHwSigningPage,
      sendAmount,
      sendSymbol,
      gasSymbol,
      transactionMeta?.id,
    ],
  );

  return { shouldRedirectToHwSigningPage, redirectToHwSigningPage };
}
