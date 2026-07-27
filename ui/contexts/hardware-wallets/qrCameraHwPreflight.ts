import { ENVIRONMENT_TYPE_FULLSCREEN } from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import WebcamUtils from '../../helpers/utils/webcam-utils';
import { QrCameraHwPreflightStatus } from './constants';
import { HardwareWalletType } from './types';
import {
  isRestrictedCameraEnvironment,
  redirectToFullscreen,
} from './webConnectionUtils';

export type EnsureQrCameraReadyForHwFlowOptions = {
  walletType: HardwareWalletType | null | undefined;
  /** Route the fullscreen tab should open (e.g. swap form or confirmation). */
  targetRoute?: string | null;
  /** Optional query string for restoring Swap / Bridge form params. */
  queryString?: string | null;
};

/**
 * True when the extension UI cannot reliably show the native camera-permission
 * prompt (popup or side panel) — same gate as {@link WebcamUtils.checkStatus}.
 *
 * @returns Whether the current environment is popup or side panel.
 */
export function isSidePanelCameraPreflightEnvironment(): boolean {
  return isRestrictedCameraEnvironment();
}

/**
 * Preflight before entering the hardware-wallet signing page for QR wallets.
 *
 * Popup and side panel cannot reliably show the native camera-permission
 * prompt (see {@link WebcamUtils.checkStatus}). If camera permission is not
 * already granted there, this opens a fullscreen tab and returns
 * {@link QrCameraHwPreflightStatus.Redirected} so the caller aborts in-panel
 * navigation to the HW page.
 *
 * Non-QR wallets and fullscreen always return
 * {@link QrCameraHwPreflightStatus.Ready}.
 *
 * @param options - Preflight options.
 * @param options.walletType - Hardware wallet type for the current account.
 * @param options.targetRoute - Route the fullscreen tab should open.
 * @param options.queryString - Optional query string for Swap / Bridge form params.
 * @returns Ready to continue in-panel, or Redirected when a fullscreen tab was opened.
 */
export async function ensureQrCameraReadyForHwFlow({
  walletType,
  targetRoute,
  queryString,
}: EnsureQrCameraReadyForHwFlowOptions): Promise<QrCameraHwPreflightStatus> {
  if (walletType !== HardwareWalletType.Qr) {
    return QrCameraHwPreflightStatus.Ready;
  }

  // Fullscreen can show the native permission prompt via getUserMedia.
  if (getEnvironmentType() === ENVIRONMENT_TYPE_FULLSCREEN) {
    return QrCameraHwPreflightStatus.Ready;
  }

  // Align with WebcamUtils / QR reader: popup + side panel are restricted, and
  // permission is detected via media-device labels (not permissions.query alone).
  try {
    const { environmentReady, permissions } = await WebcamUtils.checkStatus();
    if (environmentReady && permissions) {
      return QrCameraHwPreflightStatus.Ready;
    }
  } catch {
    // No webcam or probe failure — still open fullscreen so the user can recover.
  }

  redirectToFullscreen({ targetRoute, queryString });
  return QrCameraHwPreflightStatus.Redirected;
}
