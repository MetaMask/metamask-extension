import { TransactionType } from '@metamask/transaction-controller';
import {
  PRIMARY_TYPES_ORDER,
  PRIMARY_TYPES_PERMIT,
} from '../../../../shared/constants/signatures';
import { parseTypedDataMessage } from '../../../../shared/modules/transaction.utils';
import { Confirmation, SignatureRequestType } from '../types/confirm';
import { TYPED_SIGNATURE_VERSIONS } from '../constants';
import { sanitizeMessage } from '../../../../shared/modules/typed-signature';

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

/**
 * Returns true if the request is a SIWE signature request
 *
 * @param request - The confirmation request to check
 */
export const isSIWESignatureRequest = (request?: Confirmation) =>
  Boolean((request as SignatureRequestType)?.msgParams?.siwe?.isSIWEMessage);

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

/**
 * Returns true if the request is a Permit Typed Sign signature request
 *
 * @param request - The confirmation request to check
 */
export const isPermitSignatureRequest = (request?: Confirmation) => {
  if (
    !request ||
    !isSignatureTransactionType(request) ||
    request.type !== 'eth_signTypedData' ||
    (request as SignatureRequestType).msgParams?.version?.toUpperCase() ===
      TYPED_SIGNATURE_VERSIONS.V1
  ) {
    return false;
  }
  const { primaryType } = parseTypedDataMessage(
    (request as SignatureRequestType).msgParams?.data as string,
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
    const url = new URL(urlString);
    const { protocol, hostname, port, search, hash } = url;
    const pathname =
      url.pathname === '/' && !urlString.endsWith('/') ? '' : url.pathname;

    return `${protocol}//${hostname}${port}${pathname}${search}${hash}`;
  } catch (err: unknown) {
    console.error(`Failed to convert URL to Punycode: ${err}`);
    return undefined;
  }
};
