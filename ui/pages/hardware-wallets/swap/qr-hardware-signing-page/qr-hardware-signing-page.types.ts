import type { SerializedUR } from '@metamask/eth-qr-keyring';

import type { QrHardwareSignRequest } from '../types';

export const QrHardwareSigningPhase = {
  DisplayQrCode: 'display-qr-code',
  ScanSignature: 'scan-signature',
} as const;

export type QrHardwareSigningPhase =
  (typeof QrHardwareSigningPhase)[keyof typeof QrHardwareSigningPhase];

export type QrHardwareSigningPageProps = {
  /** Localized page title shown below the QR content area. */
  title: string;
  /** Whether the user is viewing the animated QR code or scanning a signature. */
  phase: QrHardwareSigningPhase;
  /**
   * Whether the signature being scanned is the final one in the flow. Drives
   * the "Scan next QR code" vs "Scan final QR code" button label.
   */
  isFinalSignature?: boolean;
  /** Active QR hardware wallet sign request payload. */
  payload: QrHardwareSignRequest['request']['payload'];
  /** Stable request identifier used to validate scanned signatures. */
  requestId: string;
  /** Navigates back to the previous phase or screen. */
  onBack: () => void;
  /** Cancels the QR signing flow. */
  onCancel: () => void;
  /** Advances from the QR display phase to the signature scanner. */
  onContinueToScan: () => void;
  /** Called when a valid signed QR payload is scanned. */
  onScanSuccess: (response: SerializedUR) => void | Promise<void>;
};
