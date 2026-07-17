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
   * in a Rejected / Failed / Disconnected state.
   */
  readonly isRetryable: boolean;

  /**
   * Whether a retry is currently in flight. Disables the retry and resend
   * buttons to prevent double-clicks.
   */
  readonly isRetrying: boolean;

  /**
   * Whether the "Resend transaction" button should show. True only after the
   * user has retried at least once AND the signature has been stuck for
   * longer than the stuck-timeout window.
   */
  readonly showStuckRetryButton: boolean;

  /**
   * Whether the inline-QR "Scan signature" button should be eligible. Only
   * renders when `isRetryable` is false (mutually exclusive with retry).
   */
  readonly showInlineQrCode: boolean;

  /**
   * Whether the signature being scanned is the final one in the flow. Drives
   * the "Scan next QR code" vs "Scan final QR code" button label.
   */
  readonly isFinalSignature?: boolean;

  /**
   * Current state machine status. Used to choose the retry button label
   * (reconnect vs. try-again) based on whether the device is disconnected.
   */
  readonly status: HardwareWalletSignatureStatus;

  /** Called when the user clicks retry or resend. */
  readonly handleRetry: () => Promise<void>;

  /** Called when the user clicks cancel. */
  readonly handleCancel: () => Promise<void>;

  /** Called when the user clicks "Scan signature" (inline QR flow). */
  readonly handleOpenQrSigningPage: () => void;
};
