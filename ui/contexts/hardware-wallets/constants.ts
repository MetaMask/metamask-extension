export const HARDWARE_WALLET_ERROR_MODAL_NAME = 'HARDWARE_WALLET_ERROR';

/**
 * Named values for the browser `PermissionStatus.state` union when querying the
 * `camera` permission ({@link https://developer.mozilla.org/en-US/docs/Web/API/PermissionStatus/state}).
 */
export const CameraPermissionState = {
  Granted: 'granted',
  Denied: 'denied',
  Prompt: 'prompt',
} as const;
