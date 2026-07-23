import type { HardwareWalletSignatureStatus } from '../hardware-wallet-signatures-state-machine';
import type { QrHardwareSignRequest, SignatureStepStatus } from '../types';

/**
 * Props for the {@link SignatureStepList} presentational component.
 *
 * Stateless component that renders ordered signature steps with inline QR support.
 */
export type SignatureStepListProps = {
  /** Whether to render the step list. False before quote/txMeta is resolved. */
  hasSigningRequest: boolean;

  /** Whether two confirmations are required (approval/gas-payment + final). */
  needsTwoConfirmations: boolean;

  // First step (approval for bridge / gas-payment for sendBundle)
  /** Computed display status for the first step. */
  firstStepStatus: SignatureStepStatus;
  /** Localized label for the first step. */
  firstStepLabel: string;
  /** Optional localized description beneath the first step label. */
  firstStepDescription?: string;

  // Final step (trade for bridge / transaction for sendBundle)
  /** Computed display status for the final step. */
  finalStepStatus: SignatureStepStatus;
  /** Localized label for the final step. */
  finalStepLabel: string;
  /** Optional localized description beneath the final step label. */
  finalStepDescription?: string;

  // Inline QR rendering
  /**
   * Whether to render inline QR code in the active step (vs full-page scan flow).
   * When false, no QR block renders regardless of `activeQrStep`.
   */
  showInlineQrCode: boolean;

  /** The signature step expecting a QR scan, or null when inactive. */
  activeQrStep: HardwareWalletSignatureStatus | null;

  /** QR sign request payload (requestId + cbor payload). Required for inline QR. */
  qrSignRequest: QrHardwareSignRequest | null;
};
