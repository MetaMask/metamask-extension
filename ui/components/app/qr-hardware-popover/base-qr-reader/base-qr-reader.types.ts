import type { UR } from '@ngraveio/bc-ur';

/**
 * Known UR type identifiers used in QR hardware wallet flows.
 */
export const UrType = {
  CryptoHdkey: 'crypto-hdkey',
  CryptoAccount: 'crypto-account',
  EthSignature: 'eth-signature',
} as const;

/**
 * Expected UR types for the wallet-pairing flow.
 */
export const PAIRING_EXPECTED_UR_TYPES = [
  UrType.CryptoHdkey,
  UrType.CryptoAccount,
] as const;

/**
 * Expected UR types for the transaction-signing flow.
 */
export const SIGNING_EXPECTED_UR_TYPES = [UrType.EthSignature] as const;

/**
 * Encoding used when converting a UR CBOR buffer to a hex string.
 * Shared by the QR player (encoding) and the reader/importer (decoding).
 */
export const CBOR_ENCODING = 'hex' as const;

/**
 * Camera readiness states for the QR scanner flow.
 *
 * `ACCESSING_CAMERA` - checking environment and acquiring camera.
 * `CAMERA_ACCESS_NEEDED` - user dismissed the prompt; re-requestable.
 * `CAMERA_ACCESS_BLOCKED` - persistently denied; user must change settings.
 * `READY` - camera stream acquired; QR scanner is active.
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
 * Props accepted by `BaseQrReader`.
 */
export type BaseQrReaderProps = {
  /** True when scanning a wallet sync QR code; false for transaction signing. */
  isReadingWallet: boolean;
  /**
   * UR types the consumer expects to receive (e.g. `['crypto-hdkey', 'crypto-account']`
   * for pairing, `['eth-signature']` for signing). A decoded UR whose type is
   * not in this list is rejected before `handleSuccess` is called.
   */
  expectedUrTypes: readonly string[];
  /** Called when the user cancels the QR scan flow. */
  handleCancel: () => void;
  /**
   * Called when a complete UR payload has been decoded from the QR code stream.
   * The promise may reject to surface an error in the scanner UI.
   */
  handleSuccess: (ur: UR) => Promise<unknown>;
  /** Sets the popover title to an error-specific heading (e.g. "Unknown QR code"). */
  setErrorTitle: (title: string) => void;
  /** Signals the parent that BaseQrReader is showing error content. */
  setErrorActive: (active: boolean) => void;
};

/**
 * Known webcam error type discriminants produced by `WebcamUtils`.
 */
export const WebcamErrorType = {
  NoWebcamFound: 'NO_WEBCAM_FOUND',
} as const;

/**
 * DOMException names thrown by `getUserMedia` that require special handling.
 */
export const DOMExceptionName = {
  NotAllowed: 'NotAllowedError',
} as const;

/**
 * Typed webcam error with an optional `type` discriminant used by
 * `WebcamUtils.checkStatus` for the `NO_WEBCAM_FOUND` case.
 */
export type WebcamError = Error & { type?: string };
