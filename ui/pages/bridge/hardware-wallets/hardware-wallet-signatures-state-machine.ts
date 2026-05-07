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
      type: typeof HardwareWalletSignatureEvent.FirstSignatureSubmitted;
    }
  | {
      type: typeof HardwareWalletSignatureEvent.TransactionSubmitted;
    }
  | {
      type: typeof HardwareWalletSignatureEvent.TransactionRejected;
    }
  | {
      type: typeof HardwareWalletSignatureEvent.TransactionFailed;
    }
  | {
      type: typeof HardwareWalletSignatureEvent.DeviceDisconnected;
    }
  | {
      type: typeof HardwareWalletSignatureEvent.Retry;
    }
  | {
      type: typeof HardwareWalletSignatureEvent.Reset;
      needsTwoConfirmations: boolean;
    };

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
      return {
        status: HardwareWalletSignatureStatus.Disconnected,
        disconnectedSignature: signature,
      };
    default: {
      const _exhaustiveCheck: never = event;
      return _exhaustiveCheck;
    }
  }
}

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
