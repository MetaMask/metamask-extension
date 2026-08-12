import type { SerializedUR } from '@metamask/eth-qr-keyring';
import type { ErrorCode } from '@metamask/hw-wallet-sdk';

/** Props for the QrReader component. */
export type QrReaderProps = {
  /** Called with the serialized UR when a valid ETH signature is decoded. */
  submitQRHardwareSignature: (response: SerializedUR) => Promise<unknown>;
  /** Called when the user cancels the QR signing request. */
  cancelQRHardwareSignRequest: () => void;
  /** ID of the current signing request, used to verify the scanned signature. */
  requestId: string;
  /** Sets the popover title to an error-specific heading. */
  setErrorTitle: (title: string) => void;
  /** Signals the parent that the scanner is showing error content. */
  setErrorActive: (active: boolean) => void;
  /**
   * Reports the camera-permission ErrorCode for the current recovery state,
   * or `null` when not on a permission screen.
   */
  setCameraPermissionErrorCode?: (errorCode: ErrorCode | null) => void;
};
