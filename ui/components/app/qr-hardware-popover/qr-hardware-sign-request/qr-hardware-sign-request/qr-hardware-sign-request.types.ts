import type { QrSignatureRequest } from '@metamask/eth-qr-keyring';

/**
 * Two-phase flow status for the QR hardware signing request.
 *
 * `Play` - the animated QR code is shown for the hardware wallet to scan.
 * `Read` - the camera scanner is active, reading the signed response.
 */
export const FlowStatus = {
  Play: 'play',
  Read: 'read',
} as const;

export type FlowStatusValue = (typeof FlowStatus)[keyof typeof FlowStatus];

/** Props for the QRHardwareSignRequest component. */
export type QRHardwareSignRequestProps = {
  /** The pending QR signing request with the UR payload and request ID. */
  request: QrSignatureRequest;
  /** Called when the user cancels the signing flow. */
  handleCancel: () => void;
  /** Sets the popover title to an error-specific heading. */
  setErrorTitle: (title: string) => void;
  /** Signals the parent that the scanner is showing error content. */
  setErrorActive: (active: boolean) => void;
};
