import {
  HardwareWalletSignatureEvent,
  HardwareWalletSignatureStatus,
  type HardwareWalletSignaturesAction,
  type HardwareWalletSignaturesState,
  type InterruptedSignatureEvent,
  type ResetHardwareWalletSignaturesAction,
  type SigningStatus,
} from './types';

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

/**
 * Advances from the approval signature to the final transaction signature when
 * the current flow requires two hardware wallet confirmations.
 *
 * @param state - The current hardware wallet signatures state.
 * @returns The next state, or the current state when the event is not applicable.
 */
function handleFirstSignatureSubmitted(
  state: HardwareWalletSignaturesState,
): HardwareWalletSignaturesState {
  if (state.status !== HardwareWalletSignatureStatus.AwaitingFirstSignature) {
    return state;
  }

  return {
    status: HardwareWalletSignatureStatus.AwaitingFinalSignature,
  };
}

/**
 * Marks the signing flow as submitted after the final transaction signature has
 * been completed.
 *
 * @param state - The current hardware wallet signatures state.
 * @returns The submitted state, or the current state when no signature is active.
 */
function handleTransactionSubmitted(
  state: HardwareWalletSignaturesState,
): HardwareWalletSignaturesState {
  if (!isSigningStatus(state.status)) {
    return state;
  }

  return {
    status: HardwareWalletSignatureStatus.Submitted,
  };
}

function handleReset(
  action: ResetHardwareWalletSignaturesAction,
): HardwareWalletSignaturesState {
  return getInitialHardwareWalletSignaturesState(action.needsTwoConfirmations);
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
      return handleFirstSignatureSubmitted(state);
    case HardwareWalletSignatureEvent.TransactionSubmitted:
      return handleTransactionSubmitted(state);
    case HardwareWalletSignatureEvent.TransactionRejected:
    case HardwareWalletSignatureEvent.TransactionFailed:
    case HardwareWalletSignatureEvent.DeviceDisconnected:
      return handleInterruptedSignature(state, action.type);
    case HardwareWalletSignatureEvent.Retry:
      return handleResume(state);
    case HardwareWalletSignatureEvent.Reset:
      return handleReset(action);
    default:
      return state;
  }
};
