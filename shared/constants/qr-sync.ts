/**
 * UI-observable checkpoints for the QR sync flow.
 *
 * Short-lived transport states such as controller initialization, OTP display
 * hand-off, OTP validation, and `SYNC_READY` submission are tracked via
 * `connectionStatus`, pending promises, and messenger events rather than
 * separate phases.
 */
export const QR_SYNC_PHASES = {
  IDLE: 'idle',
  DISPLAYING_QR: 'displaying-qr',
  AWAITING_OTP_INPUT: 'awaiting-otp-input',
  AWAITING_SYNC_OFFER: 'awaiting-sync-offer',
  REVIEWING_SYNC_OFFER: 'reviewing-sync-offer',
  AWAITING_SYNC_COMPLETION: 'awaiting-sync-completion',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const;

export type QrSyncPhase = (typeof QR_SYNC_PHASES)[keyof typeof QR_SYNC_PHASES];

export const QR_SYNC_TERMINAL_PHASES = [
  QR_SYNC_PHASES.CANCELLED,
  QR_SYNC_PHASES.FAILED,
] as const;

export const QR_SYNC_TIMEOUT_MS = {
  SYNC_OFFER_TIMEOUT: 5_000, // 5 seconds
  SYNC_COMPLETION_TIMEOUT: 5_000, // 5 seconds
  MWP_SESSION_TIMEOUT: 60_000, // 60 seconds
} as const;

export const QrSyncErrorCodes = {
  CHANNEL_INIT_FAILED: 'CHANNEL_INIT_FAILED',
  CHANNEL_DISCONNECTED: 'CHANNEL_DISCONNECTED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  OTP_INVALID: 'OTP_INVALID',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_ATTEMPTS_EXCEEDED: 'OTP_ATTEMPTS_EXCEEDED',
  SYNC_REJECTED: 'SYNC_REJECTED',
  SYNC_FAILED: 'SYNC_FAILED',
  QR_EXPIRED: 'QR_EXPIRED',
  UNKNOWN: 'UNKNOWN',
} as const;

export type QrSyncErrorCode =
  (typeof QrSyncErrorCodes)[keyof typeof QrSyncErrorCodes];

/**
 * Error codes that should route the UI back to an earlier step instead of the
 * generic error screen. The value is the phase whose step should be rendered.
 */
export const QR_SYNC_ERROR_PHASE_OVERRIDES: Partial<
  Record<QrSyncErrorCode, QrSyncPhase>
> = {
  [QrSyncErrorCodes.QR_EXPIRED]: QR_SYNC_PHASES.DISPLAYING_QR,
  [QrSyncErrorCodes.OTP_EXPIRED]: QR_SYNC_PHASES.AWAITING_OTP_INPUT,
  [QrSyncErrorCodes.OTP_ATTEMPTS_EXCEEDED]: QR_SYNC_PHASES.AWAITING_OTP_INPUT,
};
