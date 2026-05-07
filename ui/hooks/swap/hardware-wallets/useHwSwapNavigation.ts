import { useEffect, useRef } from 'react';

import { showSuccessToast } from '../../../components/app/toast-listener/shared';
import { useBridgeNavigation } from '../../bridge/useBridgeNavigation';
import { HardwareWalletSignatureStatus } from '../../../pages/bridge/hardware-wallet-signatures/hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from '../../../pages/bridge/hardware-wallet-signatures/hardware-wallet-signatures-state-machine';

type UseHardwareWalletNavigationOptions = {
  signatureState: HardwareWalletSignaturesState;
};

/**
 * Handles post-submission navigation for hardware wallet swap/bridge flows.
 *
 * When the signature state machine transitions to `Submitted`, this hook
 * displays a success toast and navigates the user back to the default bridge
 * route after a 1-second delay. Navigation is triggered only once per
 * submission cycle.
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

    console.log(
      '[HW-Batch] useHwSwapNavigation: Submitted → scheduling toast + navigate in 1s',
    );
    hasNavigatedAfterSubmission.current = true;

    const toastId = `bridge-hw-submitted-${Date.now()}`;
    const timer = setTimeout(async () => {
      showSuccessToast(toastId);
      await navigateToDefaultRoute();
    }, 1000);

    return () => clearTimeout(timer);
  }, [signatureState.status, navigateToDefaultRoute]);

  return {
    hasNavigatedAfterSubmission,
  };
}
