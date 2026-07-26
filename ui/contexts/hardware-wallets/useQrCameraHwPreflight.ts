import { useCallback } from 'react';
import { useHardwareWalletConfig } from './HardwareWalletContext';
import type { QrCameraHwPreflightStatus } from './constants';
import { ensureQrCameraReadyForHwFlow } from './qrCameraHwPreflight';
import { useQrCameraHwPreflightRedirect } from './useQrCameraHwPreflightRedirect';

/**
 * Returns a side-panel-only preflight callback that must run before navigating
 * to the hardware-wallet signing page.
 *
 * For QR wallets in the side panel without camera permission, opens fullscreen
 * on the swap form or confirmation (see {@link useQrCameraHwPreflightRedirect})
 * and returns {@link QrCameraHwPreflightStatus.Redirected}. Popup and fullscreen
 * skip this gate.
 *
 * @returns `ensureReadyBeforeHwFlow` async gate.
 */
export function useQrCameraHwPreflight(): {
  ensureReadyBeforeHwFlow: () => Promise<QrCameraHwPreflightStatus>;
} {
  const { walletType } = useHardwareWalletConfig();
  const { queryString, targetRoute } = useQrCameraHwPreflightRedirect();

  const ensureReadyBeforeHwFlow =
    useCallback(async (): Promise<QrCameraHwPreflightStatus> => {
      return ensureQrCameraReadyForHwFlow({
        walletType,
        targetRoute,
        queryString,
      });
    }, [walletType, targetRoute, queryString]);

  return { ensureReadyBeforeHwFlow };
}
