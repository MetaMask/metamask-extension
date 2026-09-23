import { useEffect, useRef } from 'react';

import { useBridgeNavigation } from '../bridge/useBridgeNavigation';
import { HardwareWalletSignatureStatus } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';

type UseHardwareWalletNavigationOptions = {
  signatureState: HardwareWalletSignaturesState;
};

/**
 * Handles post-submission navigation for hardware wallet swap/bridge flows.
 *
 * When the signature state machine transitions to `Submitted`, this hook
 * navigates the user back to the default bridge route after a 1-second delay.
 * Navigation is triggered only once per submission cycle.
 *
 * Transaction toasts are handled by `useTransactionEventToasts`.
 *
 * @param options - Configuration for the navigation hook.
 * @param options.signatureState - The current hardware-wallet signature state-machine state.
 * @returns An object containing `hasNavigatedAfterSubmission` — a ref tracking whether navigation has occurred.
 */
export function useHwSwapNavigation({
  signatureState,
}: UseHardwareWalletNavigationOptions) {
  const { navigateToDefaultRoute } = useBridgeNavigation();
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
      await navigateToDefaultRoute();
    }, 1000);

    return () => clearTimeout(timer);
  }, [signatureState.status, navigateToDefaultRoute]);

  return {
    hasNavigatedAfterSubmission,
  };
}
