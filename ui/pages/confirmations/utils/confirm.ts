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
import { hasTransactionType } from '../../../../shared/lib/transactions.utils';
import { sanitizeMessage } from '../../../helpers/utils/util';
import { TYPED_SIGNATURE_VERSIONS } from '../constants';
import { PAY_TRANSACTION_TYPES } from '../constants/pay';
import { Confirmation, SignatureRequestType } from '../types/confirm';

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

const MONEY_ACCOUNT_TRANSACTION_TYPES = [
  TransactionType.moneyAccountDeposit,
  TransactionType.moneyAccountWithdraw,
] as const;

/**
 * Resolves the money-account type of a transaction, including batches.
 *
 * Money-account deposits and withdrawals are created via
 * `addTransactionBatch`, so the top-level `type` is `batch` and the
 * meaningful type sits on a nested transaction — and not necessarily the
 * first one: deposits are `[approve, deposit]`, so `getTransactionType`
 * would resolve them to `tokenMethodApprove`.
 *
 * @param transactionMeta - The transaction metadata to inspect.
 * @returns The money-account type when present anywhere in the transaction,
 * otherwise undefined.
 */
export function getMoneyAccountTransactionType(
  transactionMeta: TransactionMeta | undefined,
): TransactionType | undefined {
  return MONEY_ACCOUNT_TRANSACTION_TYPES.find((transactionType) =>
    hasTransactionType(transactionMeta, [transactionType]),
  );
}

/**
 * Resolves the type to route a confirmation by, accounting for pay batches.
 *
 * Pay flows created via `addTransactionBatch` carry their meaningful type on a
 * nested transaction (the top-level `type` is `batch`), so prefer a matching
 * pay type when present and fall back to the transaction's own type otherwise.
 *
 * @param transactionMeta - The transaction metadata to inspect.
 * @returns The matching pay type when present, otherwise the top-level type.
 */
export function getConfirmationTransactionType(
  transactionMeta: TransactionMeta | undefined,
): TransactionType | undefined {
  if (!transactionMeta) {
    return undefined;
  }

  const payType = PAY_TRANSACTION_TYPES.find((type) =>
    hasTransactionType(transactionMeta, [type]),
  );

  return payType ?? transactionMeta.type;
}

type SanitizedMessage = {
  type: string;
  value: unknown;
};

function unwrapSanitizedMessage({ value }: SanitizedMessage): unknown {
  if (Array.isArray(value)) {
    return value.map((item) =>
      unwrapSanitizedMessage(item as SanitizedMessage),
    );
  }

  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        unwrapSanitizedMessage(item as SanitizedMessage),
      ]),
    );
  }

  return value;
}

/**
 * Parses EIP-712 data and filters message values to fields included in the
 * primary type's signing schema.
 *
 * @param dataToParse - The serialized EIP-712 data.
 * @returns The parsed data with display-safe message values.
 */
export const parseSanitizeTypedDataMessage = (dataToParse: string) => {
  const typedDataMessage = parseTypedDataMessage(dataToParse);
  const { message, primaryType, types } = typedDataMessage;
  const sanitizedMessage = sanitizeMessage(message, primaryType, types);

  return {
    ...typedDataMessage,
    message: unwrapSanitizedMessage(sanitizedMessage) as Record<
      string,
      unknown
    >,
    sanitizedMessage,
  };
};

type Eip712Types = Record<string, { name: string; type: string }[]>;

/**
 * Checks whether an EIP-712 type declares a field, optionally with a specific
 * Solidity type.
 *
 * @param types - The EIP-712 type definitions.
 * @param primaryType - The type definition to inspect.
 * @param fieldName - The field name to find.
 * @param fieldType - The expected Solidity type, if required.
 * @returns Whether the requested field is declared by the schema.
 */
export const isEip712PrimaryTypeField = (
  types: Eip712Types,
  primaryType: string,
  fieldName: string,
  fieldType?: string,
) =>
  types[primaryType]?.some(
    ({ name, type }) =>
      name === fieldName && (fieldType === undefined || type === fieldType),
  ) ?? false;

const MAX_UINT256 = BigInt(
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
);
const DECIMAL_UINT256_PATTERN = /^\d{1,78}$/u;
const HEXADECIMAL_UINT256_PATTERN = /^0x[\da-f]{1,64}$/iu;

/**
 * Validates and normalizes a decimal or hexadecimal uint256 value.
 *
 * @param value - The value to normalize.
 * @returns The normalized decimal value, or undefined when invalid.
 */
export const normalizeUint256 = (value: unknown): string | undefined => {
  if (
    (typeof value !== 'string' && typeof value !== 'number') ||
    (typeof value === 'number' && (!Number.isSafeInteger(value) || value < 0))
  ) {
    return undefined;
  }

  const stringValue = String(value);
  if (
    !DECIMAL_UINT256_PATTERN.test(stringValue) &&
    !HEXADECIMAL_UINT256_PATTERN.test(stringValue)
  ) {
    return undefined;
  }

  const tokenId = BigInt(stringValue);
  return tokenId <= MAX_UINT256 ? tokenId.toString() : undefined;
};

/**
 * Gets a valid token ID declared as uint256 by the primary EIP-712 type.
 *
 * @param message - The schema-filtered EIP-712 message.
 * @param types - The EIP-712 type definitions.
 * @param primaryType - The message's primary type.
 * @returns The normalized token ID, or undefined when absent or invalid.
 */
export const getEip712TokenId = (
  message: Record<string, unknown>,
  types: Eip712Types,
  primaryType: string,
): string | undefined => {
  const tokenIdField = types[primaryType]?.find(
    ({ name }) => name === 'tokenId',
  );

  if (tokenIdField?.type !== 'uint256') {
    return undefined;
  }

  return normalizeUint256(message.tokenId);
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
