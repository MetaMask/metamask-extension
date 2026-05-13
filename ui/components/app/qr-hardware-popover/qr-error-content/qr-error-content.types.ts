/**
 * The QR scan error category determines which title + body copy to show.
 *
 * - `NonUrQrCode` — scanned data does not start with `ur:` (State 3).
 * - `WrongUrType` — valid UR, but the UR type is not expected for this flow (State 4).
 * - `UrDecodeError` — `urDecoder.isError()` returned `true` (State 5).
 */
export enum QrErrorType {
  NonUrQrCode = 'nonUrQrCode',
  WrongUrType = 'wrongUrType',
  UrDecodeError = 'urDecodeError',
}

/**
 * The flow context controls whether pairing- or signing-specific copy is used.
 * State 5 (`UrDecodeError`) ignores this — its copy is universal.
 */
export enum QrErrorFlowContext {
  Pairing = 'pairing',
  Signing = 'signing',
}

/** Learn-more destination URL for QR / air-gapped hardware wallets. */
export const QR_ERROR_LEARN_MORE_URL =
  'https://support.metamask.io/more-web3/wallets/hardware-wallet-hub/#qr-codeair-gapped-wallets';

export type QrErrorContentProps = {
  /** Which error state to display. */
  errorType: QrErrorType;
  /** Whether the QR scan originated from a pairing or signing flow. */
  flowContext: QrErrorFlowContext;
  /** Invoked when the user taps "Try again". */
  onTryAgain: () => void;
};
