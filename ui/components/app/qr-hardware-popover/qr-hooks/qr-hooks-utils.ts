import { isFirefoxBrowser } from '../../../../../shared/lib/browser-runtime.utils';
import { CameraPermissionState } from '../../../../contexts/hardware-wallets/constants';
import { DOMExceptionName } from '../base-reader.types';

/**
 * Expected UR types for the wallet-pairing flow.
 */
export const PAIRING_EXPECTED_TYPES = [
  'crypto-hdkey',
  'crypto-account',
] as const;

/**
 * Expected UR types for the transaction-signing flow.
 */
export const SIGNING_EXPECTED_TYPES = ['eth-signature'] as const;

/**
 * Determines whether the camera-access-blocked UI should be shown
 * based on the current permission state and browser type.
 *
 * Blocked UI is shown when permission is explicitly denied, or when
 * the permission is still "prompt" on Firefox (which treats dismissed
 * prompts as persistent blocks).
 *
 * @param permissionState - The current camera permission state.
 * @returns True if the blocked error UI should be displayed.
 */
export function shouldShowBlockedUi(permissionState: PermissionState): boolean {
  return (
    permissionState === CameraPermissionState.Denied ||
    (permissionState === CameraPermissionState.Prompt && isFirefoxBrowser())
  );
}

/**
 * Type guard that checks whether an error is a DOMException with
 * the `NotAllowedError` name, indicating the user denied camera access.
 *
 * @param error - The caught error to check.
 * @returns True if the error is a NotAllowedError.
 */
export function isNotAllowedError(error: unknown): boolean {
  return (error as { name?: string })?.name === DOMExceptionName.NotAllowed;
}

/**
 * Extracts the current route path from the URL hash.
 *
 * Used to preserve navigation state when redirecting from popup/side-panel
 * to a fullscreen tab for camera access.
 *
 * @returns The route string (hash without the leading `#`), or null if empty.
 */
export function extractCurrentRoute(): string | null {
  const currentUrl = new URL(globalThis.location.href);
  const currentHash = currentUrl.hash;
  return currentHash ? currentHash.substring(1) : null;
}
