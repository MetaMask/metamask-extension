import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useBridgeNavigation } from '../bridge/useBridgeNavigation';
import {
  resetBridgeController,
  setFromTokenInputValue,
} from '../../ducks/bridge/actions';
import { useDispatch } from '../../store/hooks';
import { BridgeQueryParams } from '../../../shared/lib/deep-links/routes/swap';
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
 * navigates the user back to Swaps (Transaction Shield when opened from there,
 * Home for sendBundle) after a 1-second delay.
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
  const { navigateToDefaultRoute } = useBridgeNavigation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { key: locationKey, search } = useLocation();
  const isFromTransactionShield = Boolean(
    new URLSearchParams(search).get(BridgeQueryParams.IsFromTransactionShield),
  );
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
      // Swaps can stay in history (e.g. behind Transaction Shield), so never
      // leave the submitted amount behind.
      dispatch(setFromTokenInputValue(null));
      if (
        isSendBundleFlow ||
        isFromTransactionShield ||
        locationKey === 'default'
      ) {
        await navigateToDefaultRoute({ replace: isFromTransactionShield });
        return;
      }
      // The Swaps page remounts on return; clear quotes so it does not
      // restore the submitted amount.
      await dispatch(resetBridgeController());
      navigate(-1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [
    signatureState.status,
    navigateToDefaultRoute,
    isSendBundleFlow,
    isFromTransactionShield,
    locationKey,
    dispatch,
    navigate,
  ]);

  return {
    hasNavigatedAfterSubmission,
  };
}
