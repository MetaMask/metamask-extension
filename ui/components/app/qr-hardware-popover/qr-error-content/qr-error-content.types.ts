/**
 * The QR scan error category determines which title + body copy to show.
 *
 * - `NonUrQrCode` — scanned data does not start with `ur:` (State 3).
 * - `WrongUrType` — valid UR, but the UR type is not expected for this flow (State 4).
 * - `UrDecodeError` — `urDecoder.isError()` returned `true` (State 5).
 */
export const QrErrorType = {
  NonUrQrCode: 'nonUrQrCode',
  WrongUrType: 'wrongUrType',
  UrDecodeError: 'urDecodeError',
} as const;

export type QrErrorType = (typeof QrErrorType)[keyof typeof QrErrorType];

/**
 * The flow context controls whether pairing- or signing-specific copy is used.
 * State 5 (`UrDecodeError`) ignores this — its copy is universal.
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
