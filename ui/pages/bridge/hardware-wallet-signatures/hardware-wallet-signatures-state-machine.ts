export enum HardwareWalletSignatureStatus {
  AwaitingFirstSignature = 'awaiting-first-signature',
  AwaitingFinalSignature = 'awaiting-final-signature',
  Submitted = 'submitted',
  Rejected = 'rejected',
  Failed = 'failed',
}

export enum HardwareWalletSignatureEvent {
  FirstSignatureSubmitted = 'first-signature-submitted',
  TransactionSubmitted = 'transaction-submitted',
  TransactionRejected = 'transaction-rejected',
  TransactionFailed = 'transaction-failed',
  Retry = 'retry',
  Reset = 'reset',
}

type SigningStatus =
  | HardwareWalletSignatureStatus.AwaitingFirstSignature
  | HardwareWalletSignatureStatus.AwaitingFinalSignature;

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

export const hardwareWalletSignaturesReducer = (
  state: HardwareWalletSignaturesState,
  action: HardwareWalletSignaturesAction,
): HardwareWalletSignaturesState => {
  switch (action.type) {
    case HardwareWalletSignatureEvent.FirstSignatureSubmitted:
      return {
        status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
      };
    case HardwareWalletSignatureEvent.TransactionSubmitted:
      return {
        status: HardwareWalletSignatureStatus.Submitted,
      };
    case HardwareWalletSignatureEvent.TransactionRejected:
      if (
        state.status === HardwareWalletSignatureStatus.AwaitingFirstSignature ||
        state.status === HardwareWalletSignatureStatus.AwaitingFinalSignature
      ) {
        return {
          status: HardwareWalletSignatureStatus.Rejected,
          rejectedSignature: state.status,
        };
      }
      return state;
    case HardwareWalletSignatureEvent.TransactionFailed:
      if (
        state.status === HardwareWalletSignatureStatus.AwaitingFirstSignature ||
        state.status === HardwareWalletSignatureStatus.AwaitingFinalSignature
      ) {
        return {
          status: HardwareWalletSignatureStatus.Failed,
          failedSignature: state.status,
        };
      }
      return state;
    case HardwareWalletSignatureEvent.Retry:
      if (state.status === HardwareWalletSignatureStatus.Rejected) {
        return {
          status: state.rejectedSignature,
        };
      }
      if (state.status === HardwareWalletSignatureStatus.Failed) {
        return {
          status: state.failedSignature,
        };
      }
      return state;
    case HardwareWalletSignatureEvent.Reset:
      return getInitialHardwareWalletSignaturesState(
        action.needsTwoConfirmations,
      );
    default:
      return state;
  }
};
