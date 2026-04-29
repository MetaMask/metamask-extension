import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { shortenAddress } from '../../../helpers/utils/util';
import type { useI18nContext } from '../../../hooks/useI18nContext';
import {
  HardwareWalletSignatureStatus,
  type HardwareWalletSignaturesState,
} from './hardware-wallet-signatures-state-machine';
import type { QrHardwareSignRequest } from './types';

type BridgeTxHistory = Record<
  string,
  {
    approvalTxId?: unknown;
    quote?: {
      requestId?: string;
    };
  }
>;

export enum SignatureStepStatus {
  Pending = 'pending',
  Active = 'active',
  Complete = 'complete',
  Rejected = 'rejected',
  Failed = 'failed',
}

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

export const getTransactionToAddress = (
  transaction: unknown,
): string | undefined => {
  if (
    transaction &&
    typeof transaction === 'object' &&
    'to' in transaction &&
    typeof transaction.to === 'string'
  ) {
    return transaction.to;
  }

  return undefined;
};

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
    return t('transactionSubmitted');
  }

  if (status === HardwareWalletSignatureStatus.Rejected) {
    return t('bridgeHwTransactionRejected');
  }

  if (status === HardwareWalletSignatureStatus.Failed) {
    return t('transactionFailed');
  }

  const signatureStep =
    status === HardwareWalletSignatureStatus.AwaitingFirstSignature ? 1 : 2;
  const signatureCount = needsTwoConfirmations ? ` (${signatureStep}/2)` : '';

  return `${t('swapConfirmWithHwWallet')}${signatureCount}`;
};

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

  if (firstStepStatus === SignatureStepStatus.Failed) {
    return t('transactionFailed');
  }

  if (spenderAddress) {
    return t('bridgeHwSpender', [shortenAddress(spenderAddress)]);
  }

  return undefined;
};

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

const isCompletedBeforeFinalSignature = ({
  step,
  activeSignature,
}: {
  step: HardwareWalletSignatureStatus;
  activeSignature: HardwareWalletSignatureStatus;
}) =>
  step === HardwareWalletSignatureStatus.AwaitingFirstSignature &&
  activeSignature === HardwareWalletSignatureStatus.AwaitingFinalSignature;

export const getStepStatus = (
  step: HardwareWalletSignatureStatus,
  signatureState: HardwareWalletSignaturesState,
): SignatureStepStatus => {
  if (signatureState.status === HardwareWalletSignatureStatus.Submitted) {
    return SignatureStepStatus.Complete;
  }

  if (signatureState.status === HardwareWalletSignatureStatus.Rejected) {
    if (signatureState.rejectedSignature === step) {
      return SignatureStepStatus.Rejected;
    }

    return isCompletedBeforeFinalSignature({
      step,
      activeSignature: signatureState.rejectedSignature,
    })
      ? SignatureStepStatus.Complete
      : SignatureStepStatus.Pending;
  }

  if (signatureState.status === HardwareWalletSignatureStatus.Failed) {
    if (signatureState.failedSignature === step) {
      return SignatureStepStatus.Failed;
    }

    return isCompletedBeforeFinalSignature({
      step,
      activeSignature: signatureState.failedSignature,
    })
      ? SignatureStepStatus.Complete
      : SignatureStepStatus.Pending;
  }

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
