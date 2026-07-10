import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { showSuccessToast } from '../../components/app/toast-listener/shared';
import { useBridgeNavigation } from '../bridge/useBridgeNavigation';
import { HardwareWalletSignatureStatus } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';

type UseHardwareWalletNavigationOptions = {
  signatureState: HardwareWalletSignaturesState;
  /**
   * When set, post-submit navigates here instead of the bridge success path
   * (`resetBridgeController` + default bridge route). Used by sendBundle.
   */
  returnRoute?: string;
};

/**
 * Handles post-submission navigation for hardware wallet swap/bridge and
 * sendBundle flows.
 *
 * When the signature state machine transitions to `Submitted`, this hook
 * displays a success toast and navigates after a 1-second delay. Bridge/swap
 * flows use `navigateToDefaultRoute`; when `returnRoute` is provided
 * (sendBundle), navigates there with `replace: true`. Navigation is triggered
 * only once per submission cycle.
 *
 * @param options - Configuration for the navigation hook.
 * @param options.signatureState - The current hardware-wallet signature state-machine state.
 * @param options.returnRoute - Optional post-submit destination for sendBundle flows.
 * @returns An object containing `hasNavigatedAfterSubmission` — a ref tracking whether navigation has occurred.
 */
export function useHwSwapNavigation({
  signatureState,
  returnRoute,
}: UseHardwareWalletNavigationOptions) {
  const navigate = useNavigate();
  const { navigateToDefaultRoute } = useBridgeNavigation();
  const hasNavigatedAfterSubmission = useRef(false);

  useEffect(() => {
    if (
      signatureState.status !== HardwareWalletSignatureStatus.Submitted ||
      hasNavigatedAfterSubmission.current
    ) {
      return;
    }

    const toastId = `bridge-hw-submitted-${Date.now()}`;
    const timer = setTimeout(async () => {
      hasNavigatedAfterSubmission.current = true;
      showSuccessToast(toastId);
      if (returnRoute) {
        navigate(returnRoute, { replace: true });
        return;
      }
      await navigateToDefaultRoute();
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate, navigateToDefaultRoute, returnRoute, signatureState.status]);

  return {
    hasNavigatedAfterSubmission,
  };
}
