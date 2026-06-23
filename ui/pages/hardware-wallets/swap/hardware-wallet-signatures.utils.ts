import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { shortenAddress } from '../../../helpers/utils/util';
import type { useI18nContext } from '../../../hooks/useI18nContext';
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
    return t('bridgeHwAllSetTitle');
  }

  if (status === HardwareWalletSignatureStatus.Rejected) {
    return t('bridgeHwTransactionRejected');
  }

  if (status === HardwareWalletSignatureStatus.Failed) {
    return t('transactionFailed');
  }

  if (status === HardwareWalletSignatureStatus.Disconnected) {
    return t('bridgeHwDeviceDisconnected');
  }

  if (
    needsTwoConfirmations &&
    status === HardwareWalletSignatureStatus.AwaitingFinalSignature
  ) {
    return t('bridgeHwAlmostThereTitle');
  }

  return t('swapConfirmWithHwWallet');
};

/**
 * Returns the title for the full-page QR hardware wallet signing flow.
 *
 * @param options - Configuration object.
 * @param options.activeQrStep - The signature step currently using QR signing.
 * @param options.needsTwoConfirmations - Whether the transaction requires approval.
 * @param options.t - The i18n translation function.
 * @returns The localized page title string.
 */
export const getQrHardwareSigningPageTitle = ({
  activeQrStep,
  needsTwoConfirmations,
  t,
}: {
  activeQrStep: HardwareWalletSignatureStatus;
  needsTwoConfirmations: boolean;
  t: ReturnType<typeof useI18nContext>;
}) => {
  if (activeQrStep === HardwareWalletSignatureStatus.AwaitingFinalSignature) {
    return t('bridgeQrHardwareSignLastStepTitle');
  }

  if (needsTwoConfirmations) {
    return t('bridgeQrHardwareSignStepTitle', ['2', '4']);
  }

  return t('bridgeQrHardwareSignTitle', ['1', '1']);
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
    return t('bridgeHwSentAmount', [fromAmount, fromTokenSymbol]);
  }

  if (finalStepStatus === SignatureStepStatus.Active) {
    return t('bridgeHwSendingAmount', [fromAmount, fromTokenSymbol]);
  }

  return t('bridgeHwSendAmount', [fromAmount, fromTokenSymbol]);
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
    return t('bridgeHwRejected');
  }

  if (firstStepStatus === SignatureStepStatus.Disconnected) {
    return t('bridgeHwReconnectDevice');
  }

  if (firstStepStatus === SignatureStepStatus.Failed) {
    return t('transactionFailed');
  }

  if (spenderAddress) {
    return t('bridgeHwSpender', [shortenAddress(spenderAddress)]);
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

  return t('bridgeHwToAddress', [shortenAddress(toAddress)]);
};

/**
 * Computes the localized labels for the first and final signature steps,
 * branching on flow.
 *
 * sendBundle: first step = the SEND tx (signed first on the device), final
 * step = the GAS-PAYMENT tx (signed second).
 * bridge/swap: first step = approval (or "approved" once complete), final
 * step = trade (delegated to {@link getFinalStepLabel}).
 *
 * @param options - Configuration object.
 * @param options.isSendBundleFlow - True when rendering the sendBundle flow.
 * @param options.status - The current signature state machine status.
 * @param options.firstStepStatus - The display status of the first step.
 * @param options.finalStepStatus - The display status of the final step.
 * @param options.fromAmount - The amount being sent.
 * @param options.fromTokenSymbol - The symbol of the token being sent.
 * @param options.t - The i18n translation function.
 * @returns An object containing the localized `firstStepLabel` and
 * `finalStepLabel` strings.
 */
export const getStepLabels = ({
  isSendBundleFlow,
  status,
  firstStepStatus,
  finalStepStatus,
  fromAmount,
  fromTokenSymbol,
  t,
}: {
  isSendBundleFlow: boolean;
  status: HardwareWalletSignatureStatus;
  firstStepStatus: SignatureStepStatus;
  finalStepStatus: SignatureStepStatus;
  fromAmount?: string;
  fromTokenSymbol?: string;
  t: ReturnType<typeof useI18nContext>;
}): {
  firstStepLabel: string;
  finalStepLabel: string;
} => {
  if (isSendBundleFlow) {
    return {
      firstStepLabel: t('sendBundleHwTransaction'),
      finalStepLabel: t('sendBundleHwGasPayment'),
    };
  }

  const firstStepLabel =
    status === HardwareWalletSignatureStatus.Submitted ||
    firstStepStatus === SignatureStepStatus.Complete
      ? t('bridgeHwApprovedAmount', [fromAmount, fromTokenSymbol])
      : t('bridgeHwApproveAmount', [fromAmount, fromTokenSymbol]);

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
 * sendBundle: first step (SEND) shows the destination address; final step
 * (GAS-PAYMENT) has no description.
 * bridge/swap: delegates to {@link getFirstStepDescription} and
 * {@link getFinalStepDescription}.
 *
 * @param options - Configuration object.
 * @param options.isSendBundleFlow - True when rendering the sendBundle flow.
 * @param options.firstStepStatus - The display status of the first step.
 * @param options.spenderAddress - The spender contract address (bridge only).
 * @param options.toAddress - The destination address.
 * @param options.t - The i18n translation function.
 * @returns An object containing optional `firstStepDescription` and
 * `finalStepDescription` strings (either may be `undefined`).
 */
export const getStepDescriptions = ({
  isSendBundleFlow,
  firstStepStatus,
  spenderAddress,
  toAddress,
  t,
}: {
  isSendBundleFlow: boolean;
  firstStepStatus: SignatureStepStatus;
  spenderAddress?: string;
  toAddress?: string;
  t: ReturnType<typeof useI18nContext>;
}): {
  firstStepDescription?: string;
  finalStepDescription?: string;
} => {
  if (isSendBundleFlow) {
    return {
      firstStepDescription: getFinalStepDescription({ toAddress, t }),
      finalStepDescription: undefined,
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
