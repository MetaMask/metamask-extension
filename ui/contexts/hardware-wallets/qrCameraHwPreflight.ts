import { ENVIRONMENT_TYPE_SIDEPANEL } from '../../../shared/constants/app';
import { getEnvironmentType } from '../../../shared/lib/environment-type';
import {
  CameraPermissionState,
  QrCameraHwPreflightStatus,
} from './constants';
import { HardwareWalletType } from './types';
import {
  checkCameraPermission,
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
 * True when the extension UI is the side panel (the only environment where
 * QR camera preflight redirects to fullscreen).
 *
 * Popup and fullscreen tabs can show the native camera-permission prompt, so
 * they skip this gate.
 *
 * @returns Whether the current environment is the side panel.
 */
export function isSidePanelCameraPreflightEnvironment(): boolean {
  return getEnvironmentType() === ENVIRONMENT_TYPE_SIDEPANEL;
}

/**
 * Side-panel-only preflight before entering the hardware-wallet signing page
 * for QR wallets.
 *
 * The side panel cannot show the native camera-permission prompt. If permission
 * is not already granted there, this opens a fullscreen tab (where the prompt
 * can appear) and returns {@link QrCameraHwPreflightStatus.Redirected} so the
 * caller aborts in-panel navigation to the HW page.
 *
 * Non-QR wallets, popup, and fullscreen always return
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

  // Preflight redirect is side-panel only — not popup or fullscreen.
  if (!isSidePanelCameraPreflightEnvironment()) {
    return QrCameraHwPreflightStatus.Ready;
  }

  let permissionState: PermissionState;
  try {
    permissionState = await checkCameraPermission();
  } catch {
    redirectToFullscreen({ targetRoute, queryString });
    return QrCameraHwPreflightStatus.Redirected;
  }

  if (permissionState === CameraPermissionState.Granted) {
    return QrCameraHwPreflightStatus.Ready;
  }

  // `prompt` cannot surface a permission dialog in the side panel; `denied`
  // still benefits from fullscreen so the user can open settings / retry.
  redirectToFullscreen({ targetRoute, queryString });
  return QrCameraHwPreflightStatus.Redirected;
}
