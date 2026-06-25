import {
  TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import {
  PRIMARY_TYPES_ORDER,
  PRIMARY_TYPES_PERMIT,
} from '../../../../shared/constants/signatures';
import { parseTypedDataMessage } from '../../../../shared/lib/transaction.utils';
import { sanitizeMessage } from '../../../helpers/utils/util';
import { Confirmation, SignatureRequestType } from '../types/confirm';
import { TYPED_SIGNATURE_VERSIONS } from '../constants';

export const SIGNATURE_TRANSACTION_TYPES = [
  TransactionType.personalSign,
  TransactionType.signTypedData,
];

// DelegationFramework caveat enforcers revert with `Error(string)` messages of
// the form `<EnforcerName>:<reason>` (Solidity convention).
const CAVEAT_ENFORCER_REVERT_PATTERN = /^[A-Z][A-Za-z0-9]*Enforcer:/u;

const REDEEM_DELEGATIONS_SELECTOR = '0xcef6d209';

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

/**
 * @param urlString - The URL to check
 * @returns True if the URL hostname contains only ASCII characters, false otherwise. The URL is still valid if the path contains non-ASCII characters.
 */
export const isValidASCIIURL = (urlString?: string): boolean => {
  try {
    if (!urlString || urlString.length === 0) {
      return false;
    }

    return urlString.includes(new URL(urlString).host);
  } catch (exp: unknown) {
    console.error(
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Failed to detect if URL hostname contains non-ASCII characters: ${urlString}. Error: ${exp}`,
    );
    return false;
  }
};

/**
 * Converts the URL to Punycode
 *
 * @param urlString - The URL to convert
 * @returns The Punycode URL
 */
export const toPunycodeURL = (urlString: string): string | undefined => {
  try {
    const url = new URL(urlString);
    const isWithoutEndSlash = url.pathname === '/' && !urlString.endsWith('/');

    return isWithoutEndSlash ? url.href.slice(0, -1) : url.href;
  } catch (err: unknown) {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.error(`Failed to convert URL to Punycode: ${err}`);
    return undefined;
  }
};

/**
 * Removes the protocol (http://, https://, etc.) from a URL
 *
 * @param urlString - The URL to strip the protocol from
 * @returns The URL without the protocol
 */
export const stripProtocol = (urlString: string): string => {
  return urlString.replace(/^\w+:\/\//u, '');
};

/**
 * Detect whether a transaction was reverted on-chain by an enforced-simulations
 * caveat enforcer (the DelegationFramework "protection" mechanism).
 *
 * Returns true when the transaction failed AND its `txParams.data` is a
 * `redeemDelegations` call AND its decoded receipt revert reason matches the
 * Solidity `<EnforcerName>:<reason>` revert format.
 *
 * @param transactionMeta - The transaction metadata. May be undefined.
 * @returns Whether the transaction was reverted by an enforced-simulations caveat enforcer.
 */
export function isProtectedByEnforcedSimulations(
  transactionMeta?: TransactionMeta,
): boolean {
  if (!transactionMeta || transactionMeta.status !== TransactionStatus.failed) {
    return false;
  }

  const data = transactionMeta.txParams?.data;
  const revertMessage = transactionMeta.revert?.receipt?.message;

  if (
    !data ||
    !data.toLowerCase().startsWith(REDEEM_DELEGATIONS_SELECTOR) ||
    !revertMessage ||
    !CAVEAT_ENFORCER_REVERT_PATTERN.test(revertMessage)
  ) {
    return false;
  }

  return true;
}
