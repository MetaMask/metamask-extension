import { useEffect, useRef } from 'react';

import { showSuccessToast } from '../../../app/toast-listener/shared';
import { useBridgeNavigation } from '../../bridge/useBridgeNavigation';
import { HardwareWalletSignatureStatus } from '../../../pages/bridge/hardware-wallet-signatures/hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from '../../../pages/bridge/hardware-wallet-signatures/hardware-wallet-signatures-state-machine';

type UseHardwareWalletNavigationOptions = {
  signatureState: HardwareWalletSignaturesState;
};

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
