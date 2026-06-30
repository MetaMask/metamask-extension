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
  SYNC_REJECTED: 'SYNC_REJECTED',
  SYNC_FAILED: 'SYNC_FAILED',
  UNKNOWN: 'UNKNOWN',
} as const;
