import type { HardwareWalletSignatureStatus } from '../hardware-wallet-signatures-state-machine';
import type {
  QrHardwareSignRequest,
  SignatureStepStatus,
} from '../types';
import type { SignatureStepDescription } from '../hardware-wallet-signatures.utils';

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
  /** Optional structured description rendered beneath the first step label. */
  firstStepDescription?: SignatureStepDescription;

  // Final step (trade for bridge / transaction for sendBundle)
  /** Computed display status for the final step. */
  finalStepStatus: SignatureStepStatus;
  /** Localized label for the final step. */
  finalStepLabel: string;
  /** Optional structured description rendered beneath the final step label. */
  finalStepDescription?: SignatureStepDescription;

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
