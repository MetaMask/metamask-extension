/**
 * Signature states used to coordinate QR and non-QR hardware wallet signing UI.
 */
export const HardwareWalletSignatureStatus = {
  AwaitingFirstSignature: 'awaiting-first-signature',
  AwaitingFinalSignature: 'awaiting-final-signature',
  Submitted: 'submitted',
  Rejected: 'rejected',
  Failed: 'failed',
  Disconnected: 'disconnected',
} as const;

export type HardwareWalletSignatureStatus =
  (typeof HardwareWalletSignatureStatus)[keyof typeof HardwareWalletSignatureStatus];

/**
 * Events that move the hardware wallet signature state machine between signing,
 * completion, and recoverable interruption states.
 */
export const HardwareWalletSignatureEvent = {
  FirstSignatureSubmitted: 'first-signature-submitted',
  TransactionSubmitted: 'transaction-submitted',
  TransactionRejected: 'transaction-rejected',
  TransactionFailed: 'transaction-failed',
  DeviceDisconnected: 'device-disconnected',
  Retry: 'retry',
  Reset: 'reset',
} as const;

export type HardwareWalletSignatureEvent =
  (typeof HardwareWalletSignatureEvent)[keyof typeof HardwareWalletSignatureEvent];

/**
 * States where the user is actively expected to approve a signature on the
 * hardware wallet.
 */
export type SigningStatus =
  | typeof HardwareWalletSignatureStatus.AwaitingFirstSignature
  | typeof HardwareWalletSignatureStatus.AwaitingFinalSignature;

/**
 * Events that pause the active signing flow while preserving the interrupted
 * signature step for retry/resume behavior.
 */
export type InterruptedSignatureEvent =
  | typeof HardwareWalletSignatureEvent.TransactionRejected
  | typeof HardwareWalletSignatureEvent.TransactionFailed
  | typeof HardwareWalletSignatureEvent.DeviceDisconnected;

export type HardwareWalletSignatureEventWithoutPayload = Exclude<
  HardwareWalletSignatureEvent,
  typeof HardwareWalletSignatureEvent.Reset
>;

/**
 * State shape for the two-step hardware wallet signature progress UI, including
 * the interrupted step when retryable errors occur.
 */
export type HardwareWalletSignaturesState =
  | {
      status: SigningStatus | typeof HardwareWalletSignatureStatus.Submitted;
    }
  | {
      status: typeof HardwareWalletSignatureStatus.Rejected;
      rejectedSignature: SigningStatus;
    }
  | {
      status: typeof HardwareWalletSignatureStatus.Failed;
      failedSignature: SigningStatus;
    }
  | {
      status: typeof HardwareWalletSignatureStatus.Disconnected;
      disconnectedSignature: SigningStatus;
    };

export type HardwareWalletSignaturesAction =
  | {
      type: HardwareWalletSignatureEventWithoutPayload;
    }
  | {
      type: typeof HardwareWalletSignatureEvent.Reset;
      needsTwoConfirmations: boolean;
    };

export type ResetHardwareWalletSignaturesAction = Extract<
  HardwareWalletSignaturesAction,
  { type: typeof HardwareWalletSignatureEvent.Reset }
>;
