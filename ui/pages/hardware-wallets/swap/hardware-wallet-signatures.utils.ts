import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { TextColor } from '@metamask/design-system-react';
import { shortenAddress } from '../../../helpers/utils/util';
import type { useI18nContext } from '../../../hooks/useI18nContext';
import { rejectPendingApproval } from '../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import {
  HardwareWalletSignatureStatus,
  type HardwareWalletSignaturesState,
} from './hardware-wallet-signatures-state-machine';
import {
  SignatureStepStatus,
  type BridgeTxHistory,
  type QrHardwareSignRequest,
} from './types';

export {
  SignatureStepStatus,
  type BridgeTxHistory,
  type QrHardwareSignRequest,
};

/**
 * Checks whether a signature step display status represents an error
 * (rejected, failed, or disconnected).
 *
 * @param status - The signature step display status to check.
 * @returns True when the status is Rejected, Failed, or Disconnected.
 */
export const isErrorStepStatus = (status: SignatureStepStatus): boolean =>
  status === SignatureStepStatus.Rejected ||
  status === SignatureStepStatus.Failed ||
  status === SignatureStepStatus.Disconnected;

/**
 * Returns a design-system text color suitable for a signature-step label
 * based on whether the step is in an error state.
 *
 * @param stepStatus - The display status of the step.
 * @returns TextColor.ErrorDefault for error states, TextColor.TextDefault otherwise.
 */
export function getStepLabelColor(stepStatus: SignatureStepStatus): TextColor {
  return isErrorStepStatus(stepStatus)
    ? TextColor.ErrorDefault
    : TextColor.TextDefault;
}

/**
 * Returns the localization key for the QR scan button label.
 *
 * @param isFinalSignature - Whether this is the final signing step.
 * @returns The i18n key for the scan button label.
 */
export const getQrScanButtonLabelKey = (isFinalSignature: boolean): string =>
  isFinalSignature
    ? 'qrHardwareScanSignatureFinal'
    : 'qrHardwareScanSignatureNext';

/**
 * Type guard that checks whether an unknown value is a valid QR hardware
 * wallet sign request.
 *
 * @param request - The value to check.
 * @returns True if the value conforms to the QrHardwareSignRequest shape.
 */
export const isQrHardwareSignRequest = (
  request: unknown,
): request is QrHardwareSignRequest =>
  Boolean(
    request &&
    typeof request === 'object' &&
    'type' in request &&
    request.type === QrScanRequestType.SIGN &&
    'request' in request &&
    request.request &&
    typeof request.request === 'object' &&
    'requestId' in request.request &&
    typeof request.request.requestId === 'string' &&
    'payload' in request.request &&
    request.request.payload &&
    typeof request.request.payload === 'object' &&
    'type' in request.request.payload &&
    typeof request.request.payload.type === 'string' &&
    'cbor' in request.request.payload &&
    typeof request.request.payload.cbor === 'string',
  );

/**
 * Rejects the pending approval associated with a hardware-wallet signature,
 * using a user-rejected-request error. This clears the approval from the
 * background's pending queue before the caller cancels the transaction itself.
 *
 * @param dispatch - The Redux dispatch function.
 * @param id - The pending approval id to reject.
 */
export const cleanupPendingApproval = (
  dispatch: MetaMaskReduxDispatch,
  id: string,
): void => {
  dispatch(
    rejectPendingApproval(
      id,
      serializeError(providerErrors.userRejectedRequest()),
    ),
  );
};

/**
 * Extracts a 'from' or 'to' address string from a transaction object.
 * Returns undefined if the field is missing or not a string.
 *
 * @param transaction - The transaction object to inspect.
 * @param field - The field name to extract ('from' or 'to').
 * @returns The address string, or undefined if not present or not a string.
 */
export const getTransactionField = (
  transaction: unknown,
  field: 'from' | 'to',
): string | undefined => {
  if (
    transaction &&
    typeof transaction === 'object' &&
    field in transaction &&
    typeof (transaction as Record<string, unknown>)[field] === 'string'
  ) {
    return (transaction as Record<string, unknown>)[field] as string;
  }

  return undefined;
};

/**
 * Checks whether bridge transaction history contains an approval transaction
 * for the given request ID. Matches against both the history entry key and the
 * nested quote.requestId field.
 *
 * @param txHistory - The bridge transaction history to search.
 * @param requestId - The request ID to look up.
 * @returns True if a matching entry with an approvalTxId exists.
 */
export const hasApprovalTxForRequestId = (
  txHistory: BridgeTxHistory | undefined,
  requestId: string | undefined,
): boolean => {
  if (!requestId) {
    return false;
  }

  return Object.entries(txHistory ?? {}).some(
    ([historyRequestId, historyItem]) =>
      (historyRequestId === requestId ||
        historyItem.quote?.requestId === requestId) &&
      Boolean(historyItem.approvalTxId),
  );
};

/**
 * Returns the title text for the hardware wallet signature status UI based on
 * the current state machine state.
 *
 * @param options - Configuration object.
 * @param options.status - The current signature state machine status.
 * @param options.needsTwoConfirmations - Whether the transaction requires two signatures.
 * @param options.t - The i18n translation function.
 * @returns The localized title string.
 */
export const getTitle = ({
  status,
  needsTwoConfirmations,
  t,
}: {
  status: HardwareWalletSignatureStatus;
  needsTwoConfirmations: boolean;
  t: ReturnType<typeof useI18nContext>;
}) => {
  if (status === HardwareWalletSignatureStatus.Submitted) {
    return t('hardwareAllSetTitle');
  }

  if (status === HardwareWalletSignatureStatus.Rejected) {
    return t('hardwareTransactionRejected');
  }

  if (status === HardwareWalletSignatureStatus.Failed) {
    return t('transactionFailed');
  }

  if (status === HardwareWalletSignatureStatus.Disconnected) {
    return t('hardwareDeviceDisconnected');
  }

  if (
    needsTwoConfirmations &&
    status === HardwareWalletSignatureStatus.AwaitingFinalSignature
  ) {
    return t('hardwareAlmostThereTitle');
  }

  return t('swapConfirmWithHwWallet');
};

/**
 * Returns the title for the QR hardware wallet signing flow.
 *
 * A QR signature has two phases per transaction: **display** (the user scans
 * the QR code shown in MetaMask with their wallet) and **scan** (the user scans
 * the signed QR code shown on their wallet). A two-confirmation flow (approval
 * + trade) therefore has 4 steps; a single-confirmation flow has 2.
 *
 * Step numbering:
 * Two confirmations (4 steps): approval display 1, approval scan 2, trade display 3, trade scan 4.
 * Single confirmation (2 steps): display 1, scan 2.
 *
 * The final scan step uses the "Last step" title.
 *
 * @param options - Configuration object.
 * @param options.activeQrStep - The signature step currently using QR signing.
 * @param options.isDisplayPhase - True when the QR code is being displayed for
 * the user to scan with their wallet; false when scanning the signed QR code
 * back from the wallet. Defaults to the scan phase.
 * @param options.needsTwoConfirmations - Whether the transaction requires approval.
 * @param options.t - The i18n translation function.
 * @returns The localized page title string.
 */
export const getQrHardwareSigningPageTitle = ({
  activeQrStep,
  isDisplayPhase = false,
  needsTwoConfirmations,
  t,
}: {
  activeQrStep: HardwareWalletSignatureStatus;
  isDisplayPhase?: boolean;
  needsTwoConfirmations: boolean;
  t: ReturnType<typeof useI18nContext>;
}) => {
  const isFinalSignature =
    activeQrStep === HardwareWalletSignatureStatus.AwaitingFinalSignature;
  const totalSteps = needsTwoConfirmations ? 4 : 2;

  // Two-confirmation: approval 1–2, trade 3–4. Single-confirmation: 1–2.
  // Within each signature: display is the odd step, scan is the even step.
  let currentStep: number;
  if (needsTwoConfirmations && isFinalSignature) {
    currentStep = isDisplayPhase ? 3 : 4;
  } else {
    currentStep = isDisplayPhase ? 1 : 2;
  }

  const isLastStep = currentStep === totalSteps;

  // The final scan step uses the dedicated "Last step" title.
  if (!isDisplayPhase && isLastStep) {
    return t('bridgeQrHardwareSignLastStepTitle');
  }

  if (isDisplayPhase) {
    return t('bridgeQrHardwareSignDisplayStepTitle', [
      String(currentStep),
      String(totalSteps),
    ]);
  }

  return t('bridgeQrHardwareSignStepTitle', [
    String(currentStep),
    String(totalSteps),
  ]);
};

/**
 * Returns the label for the final step in the signature progress indicator.
 *
 * @param options - Configuration object.
 * @param options.status - The current signature state machine status.
 * @param options.finalStepStatus - The display status of the final step.
 * @param options.fromAmount - The amount being sent.
 * @param options.fromTokenSymbol - The symbol of the token being sent.
 * @param options.t - The i18n translation function.
 * @returns The localized step label.
 */
export const getFinalStepLabel = ({
  status,
  finalStepStatus,
  fromAmount,
  fromTokenSymbol,
  t,
}: {
  status: HardwareWalletSignatureStatus;
  finalStepStatus: SignatureStepStatus;
  fromAmount?: string;
  fromTokenSymbol?: string;
  t: ReturnType<typeof useI18nContext>;
}) => {
  if (status === HardwareWalletSignatureStatus.Submitted) {
    return t('hardwareSentAmount', [fromAmount, fromTokenSymbol]);
  }

  if (finalStepStatus === SignatureStepStatus.Active) {
    return t('hardwareSendingAmount', [fromAmount, fromTokenSymbol]);
  }

  return t('hardwareSendAmount', [fromAmount, fromTokenSymbol]);
};

/**
 * Returns the description text for the first (approval) step in the signature
 * progress indicator. Shows error states or the spender address.
 *
 * @param options - Configuration object.
 * @param options.firstStepStatus - The display status of the first step.
 * @param options.spenderAddress - The spender contract address, if applicable.
 * @param options.t - The i18n translation function.
 * @returns The localized description string, or undefined.
 */
export const getFirstStepDescription = ({
  firstStepStatus,
  spenderAddress,
  t,
}: {
  firstStepStatus: SignatureStepStatus;
  spenderAddress?: string;
  t: ReturnType<typeof useI18nContext>;
}) => {
  if (firstStepStatus === SignatureStepStatus.Rejected) {
    return t('hardwareRejected');
  }

  if (firstStepStatus === SignatureStepStatus.Disconnected) {
    return t('hardwareReconnectDevice');
  }

  if (firstStepStatus === SignatureStepStatus.Failed) {
    return t('transactionFailed');
  }

  if (spenderAddress) {
    return t('hardwareSpender', [shortenAddress(spenderAddress)]);
  }

  return undefined;
};

/**
 * Returns the description text for the final (send) step, showing the
 * destination address.
 *
 * @param options - Configuration object.
 * @param options.toAddress - The destination address, if available.
 * @param options.t - The i18n translation function.
 * @returns The localized description string, or undefined.
 */
export const getFinalStepDescription = ({
  toAddress,
  t,
}: {
  toAddress?: string;
  t: ReturnType<typeof useI18nContext>;
}) => {
  if (!toAddress) {
    return undefined;
  }

  return t('hardwareToAddress', [shortenAddress(toAddress)]);
};

/**
 * Computes the localized labels for the first and final signature steps,
 * branching on flow.
 *
 * sendBundle (two confirmations — gas-token payment): first step = the SEND
 * tx (signed first on the device; Send / Sending / Sent by status), final
 * step = the GAS-PAYMENT tx (signed second).
 * sendBundle (single confirmation — no gas token): only the final step is
 * rendered, and it IS the SEND tx, so it uses the status-aware send label.
 * bridge/swap: first step = approval (or "approved" once complete), final
 * step = trade (delegated to {@link getFinalStepLabel}).
 *
 * @param options - Configuration object.
 * @param options.isSendBundleFlow - True when rendering the sendBundle flow.
 * @param options.needsTwoConfirmations - Whether the flow renders two steps
 * (true) or a single step (false). For sendBundle, two steps means a
 * gas-token payment follows the send; one step means a plain send.
 * @param options.status - The current signature state machine status.
 * @param options.firstStepStatus - The display status of the first step.
 * @param options.finalStepStatus - The display status of the final step.
 * @param options.fromAmount - The amount being sent (bridge/swap only).
 * @param options.fromTokenSymbol - The symbol of the token being sent
 * (bridge/swap only).
 * @param options.sendAmount - The amount being sent (sendBundle flow).
 * @param options.sendSymbol - The symbol of the token being sent
 * (sendBundle flow).
 * @param options.gasSymbol - The symbol of the token used to pay the network
 * fee (always the chain's native currency). Labels the gas-payment step in a
 * two-step sendBundle flow.
 * @param options.t - The i18n translation function.
 * @returns An object containing the localized `firstStepLabel` and
 * `finalStepLabel` strings.
 */
export const getStepLabels = ({
  isSendBundleFlow,
  needsTwoConfirmations,
  status,
  firstStepStatus,
  finalStepStatus,
  fromAmount,
  fromTokenSymbol,
  sendAmount,
  sendSymbol,
  gasSymbol,
  t,
}: {
  isSendBundleFlow: boolean;
  needsTwoConfirmations: boolean;
  status: HardwareWalletSignatureStatus;
  firstStepStatus: SignatureStepStatus;
  finalStepStatus: SignatureStepStatus;
  fromAmount?: string;
  fromTokenSymbol?: string;
  sendAmount?: string;
  sendSymbol?: string;
  gasSymbol?: string;
  t: ReturnType<typeof useI18nContext>;
}): {
  firstStepLabel: string;
  finalStepLabel: string;
} => {
  if (isSendBundleFlow) {
    // Send tense mirrors getFinalStepLabel: Sent (complete), Sending (active),
    // Send (pending / interrupted).
    const getSendAmountLabel = (stepStatus: SignatureStepStatus) => {
      if (
        status === HardwareWalletSignatureStatus.Submitted ||
        stepStatus === SignatureStepStatus.Complete
      ) {
        return t('hardwareSentAmount', [sendAmount, sendSymbol]);
      }

      if (stepStatus === SignatureStepStatus.Active) {
        return t('hardwareSendingAmount', [sendAmount, sendSymbol]);
      }

      return t('hardwareSendAmount', [sendAmount, sendSymbol]);
    };

    // Two-step sendBundle: step 1 is the SEND, step 2 is the gas-token payment.
    if (needsTwoConfirmations) {
      return {
        firstStepLabel: getSendAmountLabel(firstStepStatus),
        finalStepLabel: t('sendBundleHwGasPayment', [gasSymbol]),
      };
    }

    // Single-step sendBundle: only the final step is rendered (see
    // signature-step-list.tsx), and that step IS the SEND tx, so it uses the
    // send label. `firstStepLabel` is not rendered but kept valid.
    const sendLabel = getSendAmountLabel(finalStepStatus);
    return {
      firstStepLabel: sendLabel,
      finalStepLabel: sendLabel,
    };
  }

  const firstStepLabel =
    status === HardwareWalletSignatureStatus.Submitted ||
    firstStepStatus === SignatureStepStatus.Complete
      ? t('hardwareApprovedAmount', [fromAmount, fromTokenSymbol])
      : t('hardwareApproveAmount', [fromAmount, fromTokenSymbol]);

  return {
    firstStepLabel,
    finalStepLabel: getFinalStepLabel({
      status,
      finalStepStatus,
      fromAmount,
      fromTokenSymbol,
      t,
    }),
  };
};

/**
 * Computes the optional localized descriptions for the first and final
 * signature steps, branching on flow.
 *
 * sendBundle (two confirmations — gas-token payment): first step (SEND) shows
 * the destination address; final step (GAS-PAYMENT) has no description.
 * sendBundle (single confirmation — no gas token): only the final step is
 * rendered, and it IS the SEND, so the destination address shows on the final
 * step.
 * bridge/swap: delegates to {@link getFirstStepDescription} and
 * {@link getFinalStepDescription}.
 *
 * @param options - Configuration object.
 * @param options.isSendBundleFlow - True when rendering the sendBundle flow.
 * @param options.needsTwoConfirmations - Whether the flow renders two steps
 * (true) or a single step (false).
 * @param options.firstStepStatus - The display status of the first step.
 * @param options.spenderAddress - The spender contract address (bridge only).
 * @param options.toAddress - The destination address.
 * @param options.t - The i18n translation function.
 * @returns An object containing optional `firstStepDescription` and
 * `finalStepDescription` strings (either may be `undefined`).
 */
export const getStepDescriptions = ({
  isSendBundleFlow,
  needsTwoConfirmations,
  firstStepStatus,
  spenderAddress,
  toAddress,
  t,
}: {
  isSendBundleFlow: boolean;
  needsTwoConfirmations: boolean;
  firstStepStatus: SignatureStepStatus;
  spenderAddress?: string;
  toAddress?: string;
  t: ReturnType<typeof useI18nContext>;
}): {
  firstStepDescription?: string;
  finalStepDescription?: string;
} => {
  if (isSendBundleFlow) {
    // Two-step sendBundle: destination shows on the first (SEND) step.
    if (needsTwoConfirmations) {
      return {
        firstStepDescription: getFinalStepDescription({ toAddress, t }),
        finalStepDescription: undefined,
      };
    }

    // Single-step sendBundle: only the final step is rendered, and it IS the
    // SEND, so the destination shows there.
    return {
      finalStepDescription: getFinalStepDescription({ toAddress, t }),
    };
  }

  return {
    firstStepDescription: getFirstStepDescription({
      firstStepStatus,
      spenderAddress,
      t,
    }),
    finalStepDescription: getFinalStepDescription({ toAddress, t }),
  };
};

/**
 * Returns true when the first signature step should display as complete because
 * the flow has already progressed to (or failed on) the final signature step.
 *
 * @param options - Configuration object.
 * @param options.step - The signature step being evaluated.
 * @param options.activeSignature - The signature step that is currently active or interrupted.
 * @returns True when evaluating the first step while the active step is the final step.
 */
const isCompletedBeforeFinalSignature = ({
  step,
  activeSignature,
}: {
  step: HardwareWalletSignatureStatus;
  activeSignature: HardwareWalletSignatureStatus;
}) =>
  step === HardwareWalletSignatureStatus.AwaitingFirstSignature &&
  activeSignature === HardwareWalletSignatureStatus.AwaitingFinalSignature;

/**
 * Computes the display status for a step when the flow was interrupted by
 * rejection, failure, or device disconnection.
 *
 * @param options - Configuration object.
 * @param options.step - The signature step to compute status for.
 * @param options.interruptedSignature - The signature step that was interrupted.
 * @param options.interruptedStepStatus - The display status to use when the step matches the interrupted signature.
 * @returns The computed SignatureStepStatus for this step.
 */
const getInterruptedStepStatus = ({
  step,
  interruptedSignature,
  interruptedStepStatus,
}: {
  step: HardwareWalletSignatureStatus;
  interruptedSignature: HardwareWalletSignatureStatus;
  interruptedStepStatus: SignatureStepStatus;
}): SignatureStepStatus => {
  if (interruptedSignature === step) {
    return interruptedStepStatus;
  }

  return isCompletedBeforeFinalSignature({
    step,
    activeSignature: interruptedSignature,
  })
    ? SignatureStepStatus.Complete
    : SignatureStepStatus.Pending;
};

/**
 * Computes the display status for a step while the flow is actively awaiting
 * one of the hardware wallet signatures.
 *
 * @param step - The signature step to compute status for.
 * @param signatureState - The current state machine state.
 * @returns The computed SignatureStepStatus for this step.
 */
const getActiveStepStatus = (
  step: HardwareWalletSignatureStatus,
  signatureState: HardwareWalletSignaturesState,
): SignatureStepStatus => {
  if (signatureState.status === step) {
    return SignatureStepStatus.Active;
  }

  if (
    step === HardwareWalletSignatureStatus.AwaitingFirstSignature &&
    signatureState.status ===
      HardwareWalletSignatureStatus.AwaitingFinalSignature
  ) {
    return SignatureStepStatus.Complete;
  }

  return SignatureStepStatus.Pending;
};

/**
 * Computes the display status (pending/active/complete/rejected/failed/disconnected)
 * for a given signature step based on the overall state machine state.
 *
 * @param step - The signature step to compute status for.
 * @param signatureState - The current state machine state.
 * @returns The computed SignatureStepStatus for this step.
 */
export const getStepStatus = (
  step: HardwareWalletSignatureStatus,
  signatureState: HardwareWalletSignaturesState,
): SignatureStepStatus => {
  switch (signatureState.status) {
    case HardwareWalletSignatureStatus.Submitted:
      return SignatureStepStatus.Complete;

    case HardwareWalletSignatureStatus.Rejected:
      return getInterruptedStepStatus({
        step,
        interruptedSignature: signatureState.rejectedSignature,
        interruptedStepStatus: SignatureStepStatus.Rejected,
      });

    case HardwareWalletSignatureStatus.Failed:
      return getInterruptedStepStatus({
        step,
        interruptedSignature: signatureState.failedSignature,
        interruptedStepStatus: SignatureStepStatus.Failed,
      });

    case HardwareWalletSignatureStatus.Disconnected:
      return getInterruptedStepStatus({
        step,
        interruptedSignature: signatureState.disconnectedSignature,
        interruptedStepStatus: SignatureStepStatus.Disconnected,
      });

    case HardwareWalletSignatureStatus.AwaitingFirstSignature:
    case HardwareWalletSignatureStatus.AwaitingFinalSignature:
      return getActiveStepStatus(step, signatureState);

    default:
      return SignatureStepStatus.Pending;
  }
};

/**
 * Derives first- and final-step display statuses from the signature state
 * machine in a single call instead of two separate calls.
 *
 * @param signatureState - The current state of the hardware-wallet signature state machine.
 * @returns An object containing the `first` and `final` step statuses.
 */
export function getAllStepStatuses(
  signatureState: HardwareWalletSignaturesState,
): { first: SignatureStepStatus; final: SignatureStepStatus } {
  return {
    first: getStepStatus(
      HardwareWalletSignatureStatus.AwaitingFirstSignature,
      signatureState,
    ),
    final: getStepStatus(
      HardwareWalletSignatureStatus.AwaitingFinalSignature,
      signatureState,
    ),
  };
}

/**
 * Checks whether the current state machine status represents a step where the
 * user is expected to sign on their hardware device.
 *
 * @param status - The current signature state machine status.
 * @returns True when the status is AwaitingFirstSignature or AwaitingFinalSignature.
 */
export function isAwaitingSignature(
  status: HardwareWalletSignatureStatus,
): boolean {
  return (
    status === HardwareWalletSignatureStatus.AwaitingFirstSignature ||
    status === HardwareWalletSignatureStatus.AwaitingFinalSignature
  );
}

export type HardwareWalletSignatureViewModelParams = {
  signatureState: HardwareWalletSignaturesState;
  isSendBundleFlow: boolean;
  needsTwoConfirmations: boolean;
  toAddress?: string;
  spenderAddress?: string;
  fromAmount?: string;
  fromTokenSymbol?: string;
  sendAmount?: string;
  sendSymbol?: string;
  gasSymbol?: string;
  hasSigningRequest: boolean;
  hasSignatureTimedOut: boolean;
  isRetrying: boolean;
  hasRetried: boolean;
  showInlineQrSigning: boolean;
  isReadingQrSignature: boolean;
  activeQrStep?: HardwareWalletSignatureStatus;
  t: ReturnType<typeof useI18nContext>;
};

export type HardwareWalletSignatureViewModel = {
  firstStepStatus: SignatureStepStatus;
  finalStepStatus: SignatureStepStatus;
  firstStepLabel: string;
  finalStepLabel: string;
  firstStepDescription: string;
  finalStepDescription: string;
  isRetryable: boolean;
  showStuckRetryButton: boolean;
  showFooter: boolean;
  showInlineQrCode: boolean;
  showQrSigningPage: boolean;
  qrSigningPageTitle: string | null;
  isFinalSignature: boolean;
  title: string;
  hasSigningRequest: boolean;
};

/**
 * Derives all presentational values for the hardware-wallet signing screen
 * from the current signature state and related inputs.
 *
 * Pure: same inputs always produce the same view-model output. Pass
 * `hasRetried` as a boolean snapshot rather than reading a ref.
 *
 * @param params - View-model inputs.
 * @param params.signatureState
 * @param params.isSendBundleFlow
 * @param params.needsTwoConfirmations
 * @param params.toAddress
 * @param params.spenderAddress
 * @param params.fromAmount
 * @param params.fromTokenSymbol
 * @param params.sendAmount
 * @param params.sendSymbol
 * @param params.gasSymbol
 * @param params.hasSigningRequest
 * @param params.hasSignatureTimedOut
 * @param params.isRetrying
 * @param params.hasRetried
 * @param params.showInlineQrSigning
 * @param params.isReadingQrSignature
 * @param params.activeQrStep
 * @param params.t
 * @returns Labels, flags, and titles used by the signing UI shell.
 */
export function getHardwareWalletSignatureViewModel({
  signatureState,
  isSendBundleFlow,
  needsTwoConfirmations,
  toAddress,
  spenderAddress,
  fromAmount,
  fromTokenSymbol,
  sendAmount,
  sendSymbol,
  gasSymbol,
  hasSigningRequest,
  hasSignatureTimedOut,
  isRetrying,
  hasRetried,
  showInlineQrSigning,
  isReadingQrSignature,
  activeQrStep,
  t,
}: HardwareWalletSignatureViewModelParams): HardwareWalletSignatureViewModel {
  const { first: firstStepStatus, final: finalStepStatus } =
    getAllStepStatuses(signatureState);
  const { firstStepLabel, finalStepLabel } = getStepLabels({
    isSendBundleFlow,
    needsTwoConfirmations,
    status: signatureState.status,
    firstStepStatus,
    finalStepStatus,
    fromAmount,
    fromTokenSymbol,
    sendAmount,
    sendSymbol,
    gasSymbol,
    t,
  });
  const { firstStepDescription, finalStepDescription } = getStepDescriptions({
    isSendBundleFlow,
    needsTwoConfirmations,
    firstStepStatus,
    spenderAddress,
    toAddress,
    t,
  });
  const isRetryable =
    signatureState.status === HardwareWalletSignatureStatus.Rejected ||
    signatureState.status === HardwareWalletSignatureStatus.Failed ||
    signatureState.status === HardwareWalletSignatureStatus.Disconnected;
  // "Resend transaction" button: only visible after the user has retried at
  // least once (`hasRetried`), the signature has been stuck for longer than
  // the stuck timeout, and we are still awaiting a signature.
  const showStuckRetryButton =
    hasSignatureTimedOut &&
    isAwaitingSignature(signatureState.status) &&
    !isRetrying &&
    hasRetried;
  const showFooter =
    signatureState.status !== HardwareWalletSignatureStatus.Submitted;
  const showInlineQrCode = showInlineQrSigning && !isReadingQrSignature;
  const showQrSigningPage = Boolean(
    showInlineQrSigning && activeQrStep && isReadingQrSignature,
  );
  const qrSigningPageTitle =
    activeQrStep
      ? getQrHardwareSigningPageTitle({
          activeQrStep,
          needsTwoConfirmations,
          t,
        })
      : null;
  const isFinalSignature =
    activeQrStep === HardwareWalletSignatureStatus.AwaitingFinalSignature;
  // During the inline QR display phase (the QR code is shown for the user to
  // scan with their wallet), replace the generic heading with a step-numbered
  // QR instruction such as "Step 1 of 4: Scan this QR code with your wallet".
  const qrInlineTitle =
    showInlineQrCode && activeQrStep
      ? getQrHardwareSigningPageTitle({
          activeQrStep,
          isDisplayPhase: true,
          needsTwoConfirmations,
          t,
        })
      : undefined;
  const title =
    qrInlineTitle ??
    getTitle({
      status: signatureState.status,
      needsTwoConfirmations,
      t,
    });

  return {
    firstStepStatus,
    finalStepStatus,
    firstStepLabel,
    finalStepLabel,
    firstStepDescription,
    finalStepDescription,
    isRetryable,
    showStuckRetryButton,
    showFooter,
    showInlineQrCode,
    showQrSigningPage,
    qrSigningPageTitle,
    isFinalSignature,
    title,
    hasSigningRequest,
  };
}
