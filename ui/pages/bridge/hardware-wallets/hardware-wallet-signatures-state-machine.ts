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

type ResumableStatus =
  | SigningStatus
  | typeof HardwareWalletSignatureStatus.Disconnected;

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
  if (
    state.status === HardwareWalletSignatureStatus.AwaitingFirstSignature ||
    state.status === HardwareWalletSignatureStatus.AwaitingFinalSignature
  ) {
    return state.status;
  }
  if (state.status === HardwareWalletSignatureStatus.Disconnected) {
    return state.disconnectedSignature;
  }
  return null;
}

export const hardwareWalletSignaturesReducer = (
  state: HardwareWalletSignaturesState,
  action: HardwareWalletSignaturesAction,
): HardwareWalletSignaturesState => {
  let nextState: HardwareWalletSignaturesState;

  switch (action.type) {
    case HardwareWalletSignatureEvent.FirstSignatureSubmitted:
      if (
        state.status === HardwareWalletSignatureStatus.AwaitingFirstSignature
      ) {
        nextState = {
          status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
        };
      } else {
        nextState = state;
      }
      break;
    case HardwareWalletSignatureEvent.TransactionSubmitted:
      if (
        state.status === HardwareWalletSignatureStatus.AwaitingFirstSignature ||
        state.status === HardwareWalletSignatureStatus.AwaitingFinalSignature
      ) {
        nextState = {
          status: HardwareWalletSignatureStatus.Submitted,
        };
      } else {
        nextState = state;
      }
      break;
    case HardwareWalletSignatureEvent.TransactionRejected: {
      const sig = toSigningStatus(state);
      if (sig) {
        nextState = {
          status: HardwareWalletSignatureStatus.Rejected,
          rejectedSignature: sig,
        };
      } else {
        nextState = state;
      }
      break;
    }
    case HardwareWalletSignatureEvent.TransactionFailed: {
      const sig = toSigningStatus(state);
      if (sig) {
        nextState = {
          status: HardwareWalletSignatureStatus.Failed,
          failedSignature: sig,
        };
      } else {
        nextState = state;
      }
      break;
    }
    case HardwareWalletSignatureEvent.DeviceDisconnected: {
      const sig = toSigningStatus(state);
      if (sig) {
        nextState = {
          status: HardwareWalletSignatureStatus.Disconnected,
          disconnectedSignature: sig,
        };
      } else {
        nextState = state;
      }
      break;
    }
    case HardwareWalletSignatureEvent.Retry:
      nextState = handleResume(state);
      break;
    case HardwareWalletSignatureEvent.Reset:
      nextState = getInitialHardwareWalletSignaturesState(
        action.needsTwoConfirmations,
      );
      break;
    default:
      nextState = state;
  }

  return nextState;
};
