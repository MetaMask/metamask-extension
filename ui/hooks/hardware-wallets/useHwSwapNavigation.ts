import { useEffect, useRef } from 'react';

import { useBridgeNavigation } from '../bridge/useBridgeNavigation';
import { HardwareWalletSignatureStatus } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';

type UseHardwareWalletNavigationOptions = {
  signatureState: HardwareWalletSignaturesState;
  isSendBundleFlow?: boolean;
};

/**
 * Handles post-submission navigation for hardware wallet swap/bridge flows.
 *
 * When the signature state machine transitions to `Submitted`, this hook
 * navigates the user back to Swaps (or Home for sendBundle) after a 1-second delay.
 * Navigation is triggered only once per submission cycle.
 *
 * Transaction toasts are handled by `useTransactionEventToasts`.
 *
 * @param options - Configuration for the navigation hook.
 * @param options.signatureState - The current hardware-wallet signature state-machine state.
 * @param options.isSendBundleFlow - True when signing a sendBundle (send) flow rather than a bridge/swap.
 * @returns An object containing `hasNavigatedAfterSubmission` — a ref tracking whether navigation has occurred.
 */
export function useHwSwapNavigation({
  signatureState,
  isSendBundleFlow = false,
}: UseHardwareWalletNavigationOptions) {
  const { navigateToDefaultRoute, navigateToSwapsAfterSubmit } =
    useBridgeNavigation();
  const navigateAfterSubmit = isSendBundleFlow
    ? navigateToDefaultRoute
    : navigateToSwapsAfterSubmit;
  const hasNavigatedAfterSubmission = useRef(false);

  useEffect(() => {
    if (
      signatureState.status !== HardwareWalletSignatureStatus.Submitted ||
      hasNavigatedAfterSubmission.current
    ) {
      return;
    }

    const timer = setTimeout(async () => {
      hasNavigatedAfterSubmission.current = true;
      await navigateAfterSubmit();
    }, 1000);

    return () => clearTimeout(timer);
  }, [signatureState.status, navigateAfterSubmit]);

  return {
    hasNavigatedAfterSubmission,
  };
}
