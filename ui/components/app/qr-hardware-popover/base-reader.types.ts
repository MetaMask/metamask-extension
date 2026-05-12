import type { UR } from '@ngraveio/bc-ur';

/**
 * Camera readiness states for the QR scanner flow.
 *
 * `ACCESSING_CAMERA` — initial: checking environment and acquiring camera.
 * `CAMERA_ACCESS_NEEDED` — user dismissed the prompt; re-requestable.
 * `CAMERA_ACCESS_BLOCKED` — persistently denied; user must change settings.
 * `READY` — camera stream acquired; QR scanner is active.
 */
export const CameraReadyState = {
  AccessingCamera: 'ACCESSING_CAMERA',
  CameraAccessNeeded: 'CAMERA_ACCESS_NEEDED',
  CameraAccessBlocked: 'CAMERA_ACCESS_BLOCKED',
  Ready: 'READY',
} as const;

export type CameraReadyStateValue =
  (typeof CameraReadyState)[keyof typeof CameraReadyState];

/**
 * Props accepted by `BaseReader`.
 */
export type BaseReaderProps = {
  /** True when scanning a wallet sync QR code; false for transaction signing. */
  isReadingWallet: boolean;
  /** Called when the user cancels the QR scan flow. */
  handleCancel: () => void;
  /**
   * Called when a complete UR payload has been decoded from the QR code stream.
   * The promise may reject to surface an error in the scanner UI.
   */
  handleSuccess: (ur: UR) => Promise<unknown>;
  /** Sets the popover title to an error-specific heading (e.g. "Unknown QR code"). */
  setErrorTitle: (title: string) => void;
};

/**
 * Typed webcam error with an optional `type` discriminant used by
 * `WebcamUtils.checkStatus` for the `NO_WEBCAM_FOUND` case.
 */
export type WebcamError = Error & { type?: string };
