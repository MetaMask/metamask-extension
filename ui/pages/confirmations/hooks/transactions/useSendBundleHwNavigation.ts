import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';

import { isHardwareWallet } from '../../../../../shared/lib/selectors/keyring';
import { CONFIRM_TRANSACTION_ROUTE } from '../../../../helpers/constants/routes';
import { useBridgeNavigation } from '../../../../hooks/bridge/useBridgeNavigation';
import { useGaslessSupportedSmartTransactions } from '../gas/useGaslessSupportedSmartTransactions';
import { useConfirmContext } from '../../context/confirm';
import { SEND_TRANSACTION_TYPES } from '../../constants/send';

/**
 * Determines whether the current send transaction should be redirected to the
 * hardware-wallet signing page (sendBundle flow), and performs the redirect
 * if so.
 *
 * Conditions for redirect: the current account is a hardware wallet, Smart
 * Transactions (STX) are supported for the current chain, and the transaction
 * type is in SEND_TRANSACTION_TYPES (fungible sends only — contract
 * interactions go through the bridge flow).
 *
 * Extracted from `useTransactionConfirm` to keep the confirmation
 * orchestrator focused on the standard approve path. The HW sendBundle
 * path is self-contained: it needs its own navigation, selectors, and
 * constants that are irrelevant to non-HW transactions.
 *
 * @returns `shouldRedirectToHwSigningPage` — a plain boolean for use in
 * conditionals; `redirectToHwSigningPage(newTransactionMeta)` — performs the
 * navigation (call only when `shouldRedirectToHwSigningPage` is true).
 */
export function useSendBundleHwNavigation() {
  const hardwareWalletUsed = useSelector(isHardwareWallet);
  const { isSupported: isGaslessSupportedSTX } =
    useGaslessSupportedSmartTransactions();
  const { navigateToHwSigningPage } = useBridgeNavigation();
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta | undefined>();

  const transactionType = transactionMeta?.type;
  const shouldRedirectToHwSigningPage =
    Boolean(hardwareWalletUsed) &&
    Boolean(isGaslessSupportedSTX) &&
    transactionType !== undefined &&
    SEND_TRANSACTION_TYPES.includes(transactionType);

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
          returnRoute: `${CONFIRM_TRANSACTION_ROUTE}/${transactionMeta?.id}`,
          // Wallet-safety: the signing page refuses to submit unless this id
          // is still pending. Prevents signing a stale txMeta.
          approvalRequestId: String(transactionMeta?.id),
        },
      });
    },
    [navigateToHwSigningPage, transactionMeta?.id],
  );

  return { shouldRedirectToHwSigningPage, redirectToHwSigningPage };
}
