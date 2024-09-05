import { ApprovalRequest } from '@metamask/approval-controller';
import { ApprovalType } from '@metamask/controller-utils';
import { TransactionType } from '@metamask/transaction-controller';
import { Json } from '@metamask/utils';
import {
  PRIMARY_TYPES_ORDER,
  PRIMARY_TYPES_PERMIT,
} from '../../../../shared/constants/signatures';
import { parseTypedDataMessage } from '../../../../shared/modules/transaction.utils';
import { sanitizeMessage } from '../../../helpers/utils/util';
import { SignatureRequestType } from '../types/confirm';
import { TYPED_SIGNATURE_VERSIONS } from '../constants';

export const REDESIGN_APPROVAL_TYPES = [
  ApprovalType.EthSignTypedData,
  ApprovalType.PersonalSign,
];

export const REDESIGN_USER_TRANSACTION_TYPES = [
  TransactionType.contractInteraction,
  TransactionType.deployContract,
];

export const REDESIGN_DEV_TRANSACTION_TYPES = [
  ...REDESIGN_USER_TRANSACTION_TYPES,
  TransactionType.tokenMethodApprove,
];

const SIGNATURE_APPROVAL_TYPES = [
  ApprovalType.PersonalSign,
  ApprovalType.EthSignTypedData,
];

export const isSignatureApprovalRequest = (
  request: ApprovalRequest<Record<string, Json>>,
) => SIGNATURE_APPROVAL_TYPES.includes(request.type as ApprovalType);

export const SIGNATURE_TRANSACTION_TYPES = [
  TransactionType.personalSign,
  TransactionType.signTypedData,
];

export const isSignatureTransactionType = (request?: Record<string, unknown>) =>
  request &&
  SIGNATURE_TRANSACTION_TYPES.includes(request.type as TransactionType);

export const parseSanitizeTypedDataMessage = (dataToParse: string) => {
  const { message, primaryType, types } = parseTypedDataMessage(dataToParse);
  const sanitizedMessage = sanitizeMessage(message, primaryType, types);
  return { sanitizedMessage, primaryType };
};

export const isSIWESignatureRequest = (request: SignatureRequestType) =>
  Boolean(request?.msgParams?.siwe?.isSIWEMessage);

export const isOrderSignatureRequest = (request: SignatureRequestType) => {
  if (
    !request ||
    !isSignatureTransactionType(request) ||
    request.type !== 'eth_signTypedData' ||
    request.msgParams?.version?.toUpperCase() === TYPED_SIGNATURE_VERSIONS.V1
  ) {
    return false;
  }
  const { primaryType } = parseTypedDataMessage(
    request.msgParams?.data as string,
  );

  return PRIMARY_TYPES_ORDER.includes(primaryType);
};

export const isPermitSignatureRequest = (request: SignatureRequestType) => {
  if (
    !request ||
    !isSignatureTransactionType(request) ||
    request.type !== 'eth_signTypedData' ||
    request.msgParams?.version?.toUpperCase() === TYPED_SIGNATURE_VERSIONS.V1
  ) {
    return false;
  }
  const { primaryType } = parseTypedDataMessage(
    request.msgParams?.data as string,
  );

  return PRIMARY_TYPES_PERMIT.includes(primaryType);
};

export const isValidASCIIURL = (urlString?: string) => {
  try {
    return urlString?.includes(new URL(urlString).host);
  } catch (exp: unknown) {
    console.error(exp);
    return false;
  }
};

export const toPunycodeURL = (urlString: string) => {
  try {
    return new URL(urlString).href;
  } catch (err: unknown) {
    console.error(`Failed to convert URL to Punycode: ${err}`);
    return undefined;
  }
};
