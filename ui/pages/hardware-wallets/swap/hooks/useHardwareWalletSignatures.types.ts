import type { HardwareWalletSignatureStatus } from '../hardware-wallet-signatures-state-machine';
import type { QrHardwareSignRequest } from '../types';
import type { useHwSwapQrState } from '../../../../hooks/hardware-wallets/useHwSwapQrState';
import type { SignatureStepListProps } from '../components/signature-step-list.types';
import type { SignatureFooterProps } from '../components/signature-footer.types';

/**
 * Return type of the {@link useHardwareWalletSignatures} orchestrator hook.
 *
 * The hook owns all behavior (state, refs, effects, handlers) for the
 * hardware-wallet signing-progress screen. The presentational shell consumes
 * this return value and renders structured JSX with no business logic.
 *
 * Fields are grouped by which part of the shell consumes them.
 */
export type UseHardwareWalletSignaturesReturn = {
  /** Current state machine status, used to drive the device animation. */
  signatureStatus: HardwareWalletSignatureStatus;

  /** Localized title shown above the step list. */
  title: string;

  /** Bundled props passed straight to `<SignatureStepList {...stepList} />`. */
  stepList: SignatureStepListProps;

  /** Whether the footer should render at all. */
  showFooter: boolean;
  /** Bundled props passed straight to `<SignatureFooter {...footer} />`. */
  footer: SignatureFooterProps;

  /**
   * When true (along with `qrSignRequest` and `qrSigningPageTitle`), the
   * shell renders the full-page `<QrHardwareSigningPage>` instead of the
   * inline step list.
   */
  showQrSigningPage: boolean;
  /** Active QR sign request, or null. */
  qrSignRequest: QrHardwareSignRequest | null;
  /** Title for the full-page QR signing screen, or null. */
  qrSigningPageTitle: string | null;
  /**
   * Whether the QR signature currently being collected is the final one in
   * the flow. Drives the "Scan next QR code" vs "Scan final QR code" button
   * label on both the inline footer and the full-page QR signing screen.
   */
  isFinalSignature: boolean;
  /** Called when the user dismisses the full-page QR screen. */
  handleQrSigningPageBack: () => void;
  /** Called when the user cancels the entire signing flow. */
  handleCancel: () => Promise<void>;
  /** Sets the QR-reading state from the shell (used by onContinueToScan). */
  setIsReadingQrSignature: (value: boolean) => void;
  /** Called by the QR scanner when a signature is captured. */
  handleQrScanSuccess: ReturnType<
    typeof useHwSwapQrState
  >['handleQrScanSuccess'];
};
