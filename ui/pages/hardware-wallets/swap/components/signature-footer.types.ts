import type { HardwareWalletSignatureStatus } from '../hardware-wallet-signatures-state-machine';

/**
 * Props for the {@link SignatureFooter} presentational component.
 *
 * Renders the action buttons at the bottom of the signing-progress screen:
 * retry (when retryable), resend (when stuck after first retry), scan (for
 * inline QR flow), and cancel. Visibility is fully controlled by the parent
 * via these flags — the footer owns no state.
 */
export type SignatureFooterProps = {
  /**
   * Whether the retry button should be shown. True when the state machine is
   * in aRejected / Failed / Disconnected state.
   */
  isRetryable: boolean;

  /**
   * Whether a retry is currently in flight. Disables the retry button to
   * prevent double-clicks.
   */
  isRetrying: boolean;

  /**
   * Whether the "Resend transaction" button should show. True only after the
   * user has retried at least once AND the signature has been stuck for
   * longer than the stuck-timeout window.
   */
  showStuckRetryButton: boolean;

  /**
   * Whether the inline-QR "Scan signature" button should be eligible. Only
   * renders when `isRetryable` is false (mutually exclusive with retry).
   */
  showInlineQrCode: boolean;

  /**
   * Current state machine status. Used to choose the retry button label
   * (reconnect vs. try-again) based on whether the device is disconnected.
   */
  status: HardwareWalletSignatureStatus;

  /** Called when the user clicks retry or resend. */
  handleRetry: () => Promise<void>;

  /** Called when the user clicks cancel. */
  handleCancel: () => Promise<void>;

  /** Called when the user clicks "Scan signature" (inline QR flow). */
  handleOpenQrSigningPage: () => void;
};
