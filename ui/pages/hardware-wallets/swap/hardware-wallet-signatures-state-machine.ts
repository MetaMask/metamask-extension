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

type SigningStatus =
  | typeof HardwareWalletSignatureStatus.AwaitingFirstSignature
  | typeof HardwareWalletSignatureStatus.AwaitingFinalSignature;

type InterruptedSignatureEvent =
  | typeof HardwareWalletSignatureEvent.TransactionRejected
  | typeof HardwareWalletSignatureEvent.TransactionFailed
  | typeof HardwareWalletSignatureEvent.DeviceDisconnected;

type HardwareWalletSignatureEventWithoutPayload = Exclude<
  HardwareWalletSignatureEvent,
  typeof HardwareWalletSignatureEvent.Reset
>;

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

type HardwareWalletSignaturesAction =
  | {
      type: HardwareWalletSignatureEventWithoutPayload;
    }
  | {
      type: typeof HardwareWalletSignatureEvent.Reset;
      needsTwoConfirmations: boolean;
    };

/**
 * Returns the initial state for the hardware wallet signatures state machine.
 *
 * @param needsTwoConfirmations - Whether the transaction requires two separate
 * signature confirmations on the hardware device (e.g. for bridge/swaps which
 * need both an approval and a transfer). When `true`, the initial status is
 * `AwaitingFirstSignature`; when `false`, it skips directly to `AwaitingFinalSignature`.
 * @returns The initial hardware wallet signatures state.
 */
export const getInitialHardwareWalletSignaturesState = (
  needsTwoConfirmations: boolean,
): HardwareWalletSignaturesState => ({
  status: needsTwoConfirmations
    ? HardwareWalletSignatureStatus.AwaitingFirstSignature
    : HardwareWalletSignatureStatus.AwaitingFinalSignature,
});

function isSigningStatus(
  status: HardwareWalletSignaturesState['status'],
): status is SigningStatus {
  return (
    status === HardwareWalletSignatureStatus.AwaitingFirstSignature ||
    status === HardwareWalletSignatureStatus.AwaitingFinalSignature
  );
}

function handleResume(
  state: HardwareWalletSignaturesState,
): HardwareWalletSignaturesState {
  if (state.status === HardwareWalletSignatureStatus.Rejected) {
    return { status: state.rejectedSignature };
  }
  if (state.status === HardwareWalletSignatureStatus.Failed) {
    return { status: state.failedSignature };
  }
  if (state.status === HardwareWalletSignatureStatus.Disconnected) {
    return { status: state.disconnectedSignature };
  }
  return state;
}

function toSigningStatus(
  state: HardwareWalletSignaturesState,
): SigningStatus | null {
  if (isSigningStatus(state.status)) {
    return state.status;
  }
  if (state.status === HardwareWalletSignatureStatus.Disconnected) {
    return state.disconnectedSignature;
  }
  return null;
}

function handleInterruptedSignature(
  state: HardwareWalletSignaturesState,
  event: InterruptedSignatureEvent,
): HardwareWalletSignaturesState {
  const signature = toSigningStatus(state);

  if (!signature) {
    return state;
  }

  switch (event) {
    case HardwareWalletSignatureEvent.TransactionRejected:
      return {
        status: HardwareWalletSignatureStatus.Rejected,
        rejectedSignature: signature,
      };
    case HardwareWalletSignatureEvent.TransactionFailed:
      return {
        status: HardwareWalletSignatureStatus.Failed,
        failedSignature: signature,
      };
    case HardwareWalletSignatureEvent.DeviceDisconnected:
      if (state.status === HardwareWalletSignatureStatus.Disconnected) {
        return state;
      }
      return {
        status: HardwareWalletSignatureStatus.Disconnected,
        disconnectedSignature: signature,
      };
    default:
      return state;
  }
}

/**
 * Reducer that transitions the hardware wallet signature state machine
 * based on the dispatched action event.
 *
 * @param state - The current hardware wallet signatures state.
 * @param action - The action event to process.
 * @returns The updated hardware wallet signatures state.
 */
export const hardwareWalletSignaturesReducer = (
  state: HardwareWalletSignaturesState,
  action: HardwareWalletSignaturesAction,
): HardwareWalletSignaturesState => {
  switch (action.type) {
    case HardwareWalletSignatureEvent.FirstSignatureSubmitted:
      if (
        state.status === HardwareWalletSignatureStatus.AwaitingFirstSignature
      ) {
        return {
          status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
        };
      }
      return state;
    case HardwareWalletSignatureEvent.TransactionSubmitted:
      if (isSigningStatus(state.status)) {
        return {
          status: HardwareWalletSignatureStatus.Submitted,
        };
      }
      return state;
    case HardwareWalletSignatureEvent.TransactionRejected:
    case HardwareWalletSignatureEvent.TransactionFailed:
    case HardwareWalletSignatureEvent.DeviceDisconnected:
      return handleInterruptedSignature(state, action.type);
    case HardwareWalletSignatureEvent.Retry:
      return handleResume(state);
    case HardwareWalletSignatureEvent.Reset:
      return getInitialHardwareWalletSignaturesState(
        action.needsTwoConfirmations,
      );
    default:
      return state;
  }
};
