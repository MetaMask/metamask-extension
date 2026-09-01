/**
 * QR scan error category that determines which title and body copy to show.
 *
 * - `NonUrQrCode` - scanned data does not start with `ur:`.
 * - `WrongUrType` - valid UR whose type does not match the current flow.
 * - `UrDecodeError` - the UR decoder failed to reassemble frames.
 * - `MismatchedTransaction` - the signature QR belongs to a different transaction.
 */
export const QrErrorType = {
  NonUrQrCode: 'nonUrQrCode',
  WrongUrType: 'wrongUrType',
  UrDecodeError: 'urDecodeError',
  MismatchedTransaction: 'mismatchedTransaction',
} as const;

export type QrErrorType = (typeof QrErrorType)[keyof typeof QrErrorType];

/**
 * Flow context that controls whether pairing or signing copy is used.
 * `UrDecodeError` ignores this value because its copy is universal.
 */
export const QrErrorFlowContext = {
  Pairing: 'pairing',
  Signing: 'signing',
} as const;

export type QrErrorFlowContext =
  (typeof QrErrorFlowContext)[keyof typeof QrErrorFlowContext];

export type QrErrorContentProps = {
  /** Which error state to display. */
  errorType: QrErrorType;
  /** Whether the QR scan originated from a pairing or signing flow. */
  flowContext: QrErrorFlowContext;
  /** Invoked when the user taps "Continue" to retry the scan. */
  onTryAgain: () => void;
};
