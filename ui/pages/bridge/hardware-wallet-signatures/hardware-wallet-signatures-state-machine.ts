export enum HardwareWalletSignatureStatus {
  AwaitingFirstSignature = 'awaiting-first-signature',
  AwaitingFinalSignature = 'awaiting-final-signature',
  Submitted = 'submitted',
  Rejected = 'rejected',
  Failed = 'failed',
  Disconnected = 'disconnected',
}

export enum HardwareWalletSignatureEvent {
  FirstSignatureSubmitted = 'first-signature-submitted',
  TransactionSubmitted = 'transaction-submitted',
  TransactionRejected = 'transaction-rejected',
  TransactionFailed = 'transaction-failed',
  DeviceDisconnected = 'device-disconnected',
  Retry = 'retry',
  Reset = 'reset',
}

type SigningStatus =
  | HardwareWalletSignatureStatus.AwaitingFirstSignature
  | HardwareWalletSignatureStatus.AwaitingFinalSignature;

type ResumableStatus =
  | SigningStatus
  | HardwareWalletSignatureStatus.Disconnected;

export type HardwareWalletSignaturesState =
  | {
      status: SigningStatus | HardwareWalletSignatureStatus.Submitted;
    }
  | {
      status: HardwareWalletSignatureStatus.Rejected;
      rejectedSignature: SigningStatus;
    }
  | {
      status: HardwareWalletSignatureStatus.Failed;
      failedSignature: SigningStatus;
    }
  | {
      status: HardwareWalletSignatureStatus.Disconnected;
      disconnectedSignature: SigningStatus;
    };

type HardwareWalletSignaturesAction =
  | {
      type: HardwareWalletSignatureEvent.FirstSignatureSubmitted;
    }
  | {
      type: HardwareWalletSignatureEvent.TransactionSubmitted;
    }
  | {
      type: HardwareWalletSignatureEvent.TransactionRejected;
    }
  | {
      type: HardwareWalletSignatureEvent.TransactionFailed;
    }
  | {
      type: HardwareWalletSignatureEvent.DeviceDisconnected;
    }
  | {
      type: HardwareWalletSignatureEvent.Retry;
    }
  | {
      type: HardwareWalletSignatureEvent.Reset;
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

function toResumableStatus(
  state: HardwareWalletSignaturesState,
): ResumableStatus | null {
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
      if (
        state.status === HardwareWalletSignatureStatus.AwaitingFirstSignature ||
        state.status === HardwareWalletSignatureStatus.AwaitingFinalSignature
      ) {
        return {
          status: HardwareWalletSignatureStatus.Submitted,
        };
      }
      return state;
    case HardwareWalletSignatureEvent.TransactionRejected: {
      const sig = toResumableStatus(state);
      if (sig) {
        return {
          status: HardwareWalletSignatureStatus.Rejected,
          rejectedSignature: sig,
        };
      }
      return state;
    }
    case HardwareWalletSignatureEvent.TransactionFailed: {
      const sig = toResumableStatus(state);
      if (sig) {
        return {
          status: HardwareWalletSignatureStatus.Failed,
          failedSignature: sig,
        };
      }
      return state;
    }
    case HardwareWalletSignatureEvent.DeviceDisconnected: {
      const sig = toResumableStatus(state);
      if (sig) {
        return {
          status: HardwareWalletSignatureStatus.Disconnected,
          disconnectedSignature: sig,
        };
      }
      return state;
    }
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
