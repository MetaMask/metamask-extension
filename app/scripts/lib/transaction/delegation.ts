import {
  AuthorizationList,
  TransactionEnvelopeType,
  TransactionMeta,
  decodeAuthorizationSignature,
} from '@metamask/transaction-controller';
import type {
  TransactionControllerIsAtomicBatchSupportedAction,
  TransactionControllerGetNonceLockAction,
} from '@metamask/transaction-controller';
import { Hex, bytesToHex, createProjectLogger } from '@metamask/utils';
import { toHex } from '@metamask/controller-utils';
import type { Messenger } from '@metamask/messenger';
import type { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import type { KeyringControllerSignEip7702AuthorizationAction } from '@metamask/keyring-controller';
import {
  createExactExecutionBatchTerms,
  createExactExecutionTerms,
  createLimitedCallsTerms,
  ROOT_AUTHORITY,
  ANY_BENEFICIARY,
} from '@metamask/delegation-core';
import {
  ExecutionMode,
  getDeleGatorEnvironment,
  encodeRedeemDelegations,
  BATCH_DEFAULT_MODE,
  SINGLE_DEFAULT_MODE,
  type ExecutionStruct,
  type Caveat,
  type Delegation,
  type UnsignedDelegation,
} from '../../../../shared/lib/delegation';

const log = createProjectLogger('transaction-delegation');

export const PRIMARY_TYPE_DELEGATION = 'Delegation';

/**
 * Must match the placeholder used by the Intents / Relay execute API so
 * subsidized quotes can inject the real order ID after signing.
 */
export const SUBSIDIZED_ORDER_ID_PLACEHOLDER =
  '0x07cece46d0aec658b12c9d194b3ac3cc74aadf102176005c76f96422b57328b2' as Hex;

/** The number of bytes in a function selector. */
const SELECTOR_BYTES = 4;

/** A byte range within calldata: [start, end) in bytes, not hex characters. */
type ByteRange = {
  start: number;
  end: number;
};

/** A run of calldata bytes to enforce, plus its byte start index. */
type EnforcedSegment = {
  startIndex: number;
  value: Hex;
};

export type DelegationMessengerActions =
  | DelegationControllerSignDelegationAction
  | KeyringControllerSignEip7702AuthorizationAction
  | TransactionControllerGetNonceLockAction
  | TransactionControllerIsAtomicBatchSupportedAction;

export type DelegationMessenger = Messenger<
  string,
  DelegationMessengerActions,
  never
>;

type AuthorizationRequest = {
  minimal?: boolean;

  upgradeContractAddress?: Hex;

  /**
   * When false, throws if the account is already upgraded to a
   * different delegation address. Defaults to true.
   */
  upgradeExistingDelegation?: boolean;
};

type ConvertTransactionToRedeemDelegationsRequest = {
  transaction: TransactionMeta;
  messenger: DelegationMessenger;

  /**
   * Override default caveats derived from the transaction.
   * When provided, these caveats are used directly instead of
   * building from nestedTransactions / txParams.
   */
  caveats?: Caveat[];

  /**
   * Extra executions appended to the default execution batch.
   * The default execution is derived from nestedTransactions
   * (or txParams as fallback).
   */
  additionalExecutions?: ExecutionStruct[];

  /**
   * The delegation target address.
   * Defaults to ANY_BENEFICIARY.
   */
  delegatee?: Hex;

  /**
   * Pre-computed delegation signature. When provided, the messenger
   * is not called to sign the delegation. Useful for simulations
   * that use a mock signature.
   */
  delegationSignature?: Hex;

  /**
   * When provided, builds an EIP-7702 authorization list for the transaction.
   * Omit to skip authorization list building entirely.
   */
  authorization?: AuthorizationRequest;

  /**
   * When true, build the Relay-execute subsidized shape: a single execution
   * of the 7702 batch and caveats that leave the order-id placeholder free.
   */
  isSubsidized?: boolean;

  /**
   * When true, build a single execution from the parent `txParams` (`to` /
   * `data`) even when `nestedTransactions` exist. Matches the mobile publish
   * hook: for 7702 batches the parent `execute()` calldata is the canonical
   * payload — redeeming the nested calls directly is a shape mobile never
   * publishes and it does not move funds on-chain (e.g. sponsored Money
   * Account withdrawals on Monad).
   */
  useParentExecution?: boolean;
};

type ConvertTransactionToRedeemDelegationsResult = {
  authorizationList?: AuthorizationList;
  data: Hex;
  to: Hex;
  type: TransactionEnvelopeType;
};

type GetDelegationTransactionRequest = {
  /**
   * Messenger that can perform at least the delegation / EIP-7702 signing
   * actions. Callers may pass a wider messenger (e.g. payment-override init).
   */
  messenger: Messenger<string, DelegationMessengerActions, never>;
  isSubsidized?: boolean;
};

type DelegationTransactionResult = {
  authorizationList?: AuthorizationList;
  data: Hex;
  to: Hex;
  type: TransactionEnvelopeType;
  value: Hex;
};

/**
 * Converts a transaction into a redeemDelegations call.
 *
 * By default, caveats, executions, and modes are derived from the
 * transaction's nestedTransactions (or txParams as fallback).
 * Callers can override caveats and append additional executions
 * to customise the delegation (e.g. gas-fee-token flows).
 *
 * @param request - The conversion request.
 * @returns The encoded calldata, delegation manager address, and optional authorization list.
 */
export async function convertTransactionToRedeemDelegations(
  request: ConvertTransactionToRedeemDelegationsRequest,
): Promise<ConvertTransactionToRedeemDelegationsResult> {
  const { transaction, messenger, isSubsidized = false } = request;
  const { chainId } = transaction;
  const environment = getDeleGatorEnvironment(parseInt(chainId, 16));

  // Subsidized caveats are built first so a missing batch target/calldata
  // throws with the same prefixed error as mobile.
  const subsidizedCaveats =
    isSubsidized && !request.caveats
      ? buildSubsidizedCaveats(environment, transaction)
      : undefined;

  const defaultExecutions = isSubsidized
    ? buildSubsidizedExecutions(transaction)
    : getDefaultTransactionExecutions(transaction, request.useParentExecution);

  const additionalExecutions = isSubsidized
    ? []
    : (request.additionalExecutions ?? []);
  const executions: ExecutionStruct[][] = [
    [...defaultExecutions, ...additionalExecutions],
  ];

  const caveats =
    request.caveats ??
    subsidizedCaveats ??
    buildDefaultCaveats(environment, executions[0]);

  const modes: ExecutionMode[] = [
    isSubsidized || executions[0].length <= 1
      ? SINGLE_DEFAULT_MODE
      : BATCH_DEFAULT_MODE,
  ];

  const delegations = await signAndWrapDelegation({
    transaction,
    caveats,
    messenger,
    delegatee: request.delegatee,
    delegationSignature: request.delegationSignature,
  });

  log('Built delegations', { delegations, modes, executions });

  const data = encodeRedeemDelegations({
    delegations,
    modes,
    executions,
  });

  const authorizationList = request.authorization
    ? await buildAuthorizationList(
        transaction,
        messenger,
        request.authorization,
      )
    : undefined;

  return {
    authorizationList,
    data,
    to: environment.DelegationManager,
    type: authorizationList
      ? TransactionEnvelopeType.setCode
      : (transaction.txParams.type as TransactionEnvelopeType),
  };
}

export async function getDelegationTransaction(
  request: GetDelegationTransactionRequest,
  transaction: TransactionMeta,
): Promise<DelegationTransactionResult> {
  const { authorizationList, data, to, type } =
    await convertTransactionToRedeemDelegations({
      transaction,
      messenger: request.messenger,
      authorization: {},
      isSubsidized: request.isSubsidized,
    });

  return {
    authorizationList,
    data,
    to,
    type,
    value: '0x0',
  };
}

export function normalizeCallData(data: unknown): Hex {
  if (typeof data !== 'string' || data.length === 0) {
    return '0x';
  }

  const hasHexPrefix = data.slice(0, 2).toLowerCase() === '0x';
  const lower = data.toLowerCase();
  const prefixed = hasHexPrefix ? `0x${lower.slice(2)}` : `0x${lower}`;
  const hexBody = prefixed.slice(2);

  if (hexBody.length === 0) {
    return '0x';
  }

  if (hexBody.length % 2 !== 0) {
    return normalizeCallData(`0x0${hexBody}`);
  }

  return prefixed as Hex;
}

function hasExecutableNestedTransactions(
  transactionMeta: TransactionMeta,
): boolean {
  const { nestedTransactions } = transactionMeta;
  return Boolean(nestedTransactions?.length && nestedTransactions[0].to);
}

function getDefaultTransactionExecutions(
  transactionMeta: TransactionMeta,
  useParentExecution = false,
): ExecutionStruct[] {
  const { nestedTransactions, txParams } = transactionMeta;

  if (
    !useParentExecution &&
    nestedTransactions?.length &&
    hasExecutableNestedTransactions(transactionMeta)
  ) {
    return nestedTransactions.map((tx) => ({
      target: tx.to as Hex,
      value: BigInt(tx.value ?? '0x0'),
      callData: normalizeCallData(tx.data),
    }));
  }

  return [
    {
      target: txParams.to as Hex,
      value: BigInt((txParams.value as Hex) ?? '0x0'),
      callData: normalizeCallData(txParams.data),
    },
  ];
}

function buildDefaultCaveats(
  environment: ReturnType<typeof getDeleGatorEnvironment>,
  executions: ExecutionStruct[],
): Caveat[] {
  const caveats: Caveat[] = [
    {
      enforcer: environment.caveatEnforcers.LimitedCallsEnforcer,
      terms: createLimitedCallsTerms({
        limit: 1,
      }),
      args: '0x',
    },
  ];

  if (executions.length > 1) {
    caveats.push({
      enforcer: environment.caveatEnforcers.ExactExecutionBatchEnforcer,
      terms: createExactExecutionBatchTerms({
        executions,
      }),
      args: '0x',
    });
  } else {
    const execution = executions[0];

    caveats.push({
      enforcer: environment.caveatEnforcers.ExactExecutionEnforcer,
      terms: createExactExecutionTerms({
        execution,
      }),
      args: '0x',
    });
  }

  return caveats;
}

/**
 * Builds the single batch execution for a subsidized Relay redeem.
 *
 * The execution target and value come from `txParams`; calldata is normalized
 * via {@link normalizeCallData} so odd-length hex cannot shift byte offsets
 * used by the AllowedCalldata caveats below.
 *
 * @param transactionMeta - Transaction whose batch calldata will be redeemed.
 * @returns A one-element execution list for the Relay redeem path.
 */
function buildSubsidizedExecutions(
  transactionMeta: TransactionMeta,
): ExecutionStruct[] {
  const { txParams } = transactionMeta;
  const target = txParams.to as Hex | undefined;
  const callData = txParams.data as Hex | undefined;

  if (!target || !callData) {
    throw new Error('Missing batch target or calldata');
  }

  return [
    {
      target,
      value: BigInt(txParams.value ?? '0x0'),
      callData: normalizeCallData(callData),
    },
  ];
}

/**
 * Builds caveats for a subsidized Relay redeem: allow the batch target, limit
 * to one call, and enforce every calldata byte except the Relay order-ID
 * placeholder window(s). That window must stay mutable so Relay can inject the
 * real order ID after the user signs.
 *
 * @param environment - DeleGator environment with caveat enforcer addresses.
 * @param transaction - Transaction whose calldata and nested calls are enforced.
 * @returns Caveats for the subsidized delegation.
 */
function buildSubsidizedCaveats(
  environment: ReturnType<typeof getDeleGatorEnvironment>,
  transaction: TransactionMeta,
): Caveat[] {
  try {
    return buildSubsidizedCaveatsInternal(environment, transaction);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Subsidized Caveats: ${message}`, { cause: error });
  }
}

/**
 * Implementation of {@link buildSubsidizedCaveats}. AllowedTargets +
 * LimitedCalls(1) wrap AllowedCalldata segments from
 * {@link getEnforcedSegments}.
 *
 * @param environment - DeleGator environment with caveat enforcer addresses.
 * @param transaction - Transaction whose calldata and nested calls are enforced.
 * @returns Caveats for the subsidized delegation.
 */
function buildSubsidizedCaveatsInternal(
  environment: ReturnType<typeof getDeleGatorEnvironment>,
  transaction: TransactionMeta,
): Caveat[] {
  const { txParams } = transaction;
  const target = txParams.to as Hex | undefined;
  const calldata = txParams.data as Hex | undefined;

  if (!target || !calldata) {
    throw new Error('Missing batch target or calldata');
  }

  const caveats: Caveat[] = [
    {
      enforcer: environment.caveatEnforcers.AllowedTargetsEnforcer,
      terms: concatHex([normalizeCallData(target)]),
      args: '0x',
    },
    {
      enforcer: environment.caveatEnforcers.LimitedCallsEnforcer,
      terms: createLimitedCallsTerms({
        limit: 1,
      }),
      args: '0x',
    },
  ];

  for (const { startIndex, value } of getEnforcedSegments(
    normalizeCallData(calldata),
    transaction.nestedTransactions ?? [],
  )) {
    caveats.push({
      enforcer: environment.caveatEnforcers.AllowedCalldataEnforcer,
      terms: concatHex([toUint256Hex(startIndex), value]),
      args: '0x',
    });
  }

  return caveats;
}

/**
 * Enforces every calldata byte except the order-ID placeholder window(s).
 *
 * @param calldata - The 0x-prefixed batch calldata (txParams.data).
 * @param nestedTransactions - The batch's nested calls, used to locate split points.
 * @returns The segments to enforce, ordered by byte start index.
 */
function getEnforcedSegments(
  calldata: Hex,
  nestedTransactions: { data?: string }[],
): EnforcedSegment[] {
  const freeRanges = findByteRanges(calldata, [
    SUBSIDIZED_ORDER_ID_PLACEHOLDER,
  ]);

  const splitPoints = getSplitPoints(calldata, nestedTransactions);

  return getSegmentsBetweenFreeRanges(calldata, freeRanges, splitPoints);
}

/**
 * Byte offset after the selector of each order-ID-bearing nested call.
 *
 * @param calldata - The 0x-prefixed batch calldata.
 * @param nestedTransactions - The nested calls to locate.
 * @returns The post-selector byte offsets, sorted ascending, deduplicated.
 */
function getSplitPoints(
  calldata: Hex,
  nestedTransactions: { data?: string }[],
): number[] {
  const placeholderBody =
    SUBSIDIZED_ORDER_ID_PLACEHOLDER.slice(2).toLowerCase();

  const nestedData = nestedTransactions
    .map((tx) => tx.data)
    // length >= 10 ensures at least a 0x-prefixed 4-byte selector.
    .filter((data): data is string => data !== undefined && data.length >= 10)
    .map((data) => data.toLowerCase() as Hex)
    // Only order-ID-bearing calls need an isolated boundary.
    .filter((data) => data.includes(placeholderBody));

  const ranges = findByteRanges(calldata, nestedData);

  const points = ranges.map((range) => range.start + SELECTOR_BYTES);

  return [...new Set(points)].sort((a, b) => a - b);
}

/**
 * Every whole-byte-aligned occurrence of each needle in calldata.
 *
 * @param calldata - The 0x-prefixed calldata to search.
 * @param needles - The 0x-prefixed values to locate.
 * @returns The byte ranges [start, end) of every occurrence, unsorted.
 */
function findByteRanges(calldata: Hex, needles: Hex[]): ByteRange[] {
  const haystack = calldata.slice(2).toLowerCase();

  return needles.flatMap((needle) => {
    const body = needle.slice(2).toLowerCase();
    const byteLength = body.length / 2;
    const ranges: ByteRange[] = [];

    let charIndex = haystack.indexOf(body);
    while (charIndex !== -1) {
      // Only whole-byte boundaries are meaningful (each byte is two hex chars).
      if (charIndex % 2 === 0) {
        const start = charIndex / 2;
        ranges.push({ start, end: start + byteLength });
      }
      charIndex = haystack.indexOf(body, charIndex + 1);
    }

    return ranges;
  });
}

/**
 * Enforces the bytes outside the free ranges, ending a segment at each split point.
 *
 * @param calldata - The 0x-prefixed calldata.
 * @param freeRanges - Ranges to leave free (order-ID placeholder windows).
 * @param splitPoints - Byte offsets at which to end a segment (post-selector).
 * @returns The enforced segments ordered by byte start index.
 */
function getSegmentsBetweenFreeRanges(
  calldata: Hex,
  freeRanges: ByteRange[],
  splitPoints: number[],
): EnforcedSegment[] {
  const totalBytes = (calldata.length - 2) / 2;
  const sliceValue = (start: number, end: number): Hex =>
    `0x${calldata.slice(2 + start * 2, 2 + end * 2)}` as Hex;

  const sortedFree = [...freeRanges].sort((a, b) => a.start - b.start);
  const sortedSplitPoints = [...splitPoints].sort((a, b) => a - b);

  const segments: EnforcedSegment[] = [];

  // Walk the ranges between free windows, ending a segment at each split point.
  let cursor = 0;
  for (const free of [...sortedFree, { start: totalBytes, end: totalBytes }]) {
    addSegments(cursor, free.start, sortedSplitPoints, segments, sliceValue);
    cursor = Math.max(cursor, free.end);
  }

  return segments;
}

/**
 * Enforces [start, end), ending a segment at each split point inside it; the preceding
 * selector folds into that segment.
 *
 * @param start - The first byte of the range (inclusive).
 * @param end - The end of the range (exclusive).
 * @param sortedSplitPoints - Split points sorted ascending, spanning the whole calldata.
 * @param segments - The accumulator to push enforced segments onto.
 * @param sliceValue - Extracts the 0x-prefixed value for a byte range.
 */
function addSegments(
  start: number,
  end: number,
  sortedSplitPoints: number[],
  segments: EnforcedSegment[],
  sliceValue: (from: number, to: number) => Hex,
): void {
  const pushSegment = (from: number, to: number) => {
    if (to > from) {
      segments.push({ startIndex: from, value: sliceValue(from, to) });
    }
  };

  const pointsInRange = sortedSplitPoints.filter(
    (point) => point > start && point < end,
  );

  let cursor = start;
  for (const point of pointsInRange) {
    pushSegment(cursor, point);
    cursor = point;
  }

  pushSegment(cursor, end);
}

/**
 * Concatenates 0x-prefixed hex values into one lowercase 0x hex string.
 * Each input's `0x` prefix is stripped before joining so the result stays
 * byte-aligned for caveat terms.
 *
 * @param values - Hex values to concatenate.
 * @returns Single lowercase 0x-prefixed hex string.
 */
function concatHex(values: Hex[]): Hex {
  return `0x${values.map((value) => value.slice(2).toLowerCase()).join('')}` as Hex;
}

/**
 * Encodes a non-negative integer as a 32-byte (uint256) hex value for caveat
 * terms such as AllowedCalldata start offsets.
 *
 * @param value - Byte offset or other non-negative integer.
 * @returns 0x-prefixed 64-nibble hex encoding of `value`.
 */
function toUint256Hex(value: number): Hex {
  return `0x${value.toString(16).padStart(64, '0')}` as Hex;
}

async function signAndWrapDelegation({
  transaction,
  caveats,
  messenger,
  delegatee,
  delegationSignature,
}: {
  transaction: TransactionMeta;
  caveats: Caveat[];
  messenger: DelegationMessenger;
  delegatee?: Hex;
  delegationSignature?: Hex;
}): Promise<Delegation[][]> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const salt = bytesToHex(bytes);

  const unsignedDelegation: UnsignedDelegation = {
    delegator: transaction.txParams.from as Hex,
    delegate: delegatee ?? ANY_BENEFICIARY,
    authority: ROOT_AUTHORITY,
    salt,
    caveats,
  };

  log('Signing delegation', unsignedDelegation);

  const signature =
    delegationSignature ??
    ((await messenger.call('DelegationController:signDelegation', {
      chainId: transaction.chainId,
      delegation: unsignedDelegation,
    })) as Hex);

  log('Delegation signature', signature);

  return [[{ ...unsignedDelegation, signature }]];
}

async function getNextNonce(
  messenger: DelegationMessenger,
  address: string,
  networkClientId: string,
): Promise<Hex> {
  const nonceLock = await messenger.call(
    'TransactionController:getNonceLock',
    address,
    networkClientId,
  );

  nonceLock.releaseLock();
  return toHex(nonceLock.nextNonce);
}

async function resolveUpgradeContractAddress(
  transaction: TransactionMeta,
  messenger: DelegationMessenger,
  authorization: AuthorizationRequest,
): Promise<Hex | undefined> {
  if (authorization.upgradeContractAddress) {
    return authorization.upgradeContractAddress;
  }

  const { chainId, txParams } = transaction;

  const atomicBatchResult = await messenger.call(
    'TransactionController:isAtomicBatchSupported',
    {
      address: txParams.from as Hex,
      chainIds: [chainId],
    },
  );

  const chainResult = atomicBatchResult.find(
    (r) => r.chainId.toLowerCase() === chainId.toLowerCase(),
  );

  if (!chainResult) {
    throw new Error('Chain does not support EIP-7702');
  }

  const { delegationAddress, isSupported, upgradeContractAddress } =
    chainResult;

  if (isSupported) {
    log('Skipping authorization as already upgraded');
    return undefined;
  }

  if (delegationAddress && authorization.upgradeExistingDelegation === false) {
    throw new Error(
      `Account is already upgraded to a different delegation address: ${delegationAddress}`,
    );
  }

  if (!upgradeContractAddress) {
    throw new Error('Upgrade contract address not found');
  }

  if (delegationAddress) {
    log('Overwriting existing delegation', {
      current: delegationAddress,
      new: upgradeContractAddress,
    });
  }

  return upgradeContractAddress;
}

async function buildAuthorizationList(
  transaction: TransactionMeta,
  messenger: DelegationMessenger,
  authorization: AuthorizationRequest,
): Promise<AuthorizationList | undefined> {
  const upgradeContractAddress = await resolveUpgradeContractAddress(
    transaction,
    messenger,
    authorization,
  );

  if (!upgradeContractAddress) {
    return undefined;
  }

  if (authorization.minimal) {
    return [{ address: upgradeContractAddress }];
  }

  const { chainId, txParams, networkClientId } = transaction;
  const { from } = txParams;

  log('Upgrading account to EIP-7702', { from, upgradeContractAddress });

  const nonce = await getNextNonce(messenger, from, networkClientId);

  const authorizationSignature = (await messenger.call(
    'KeyringController:signEip7702Authorization',
    {
      chainId: parseInt(chainId, 16),
      contractAddress: upgradeContractAddress,
      from,
      nonce: parseInt(nonce, 16),
    },
  )) as Hex;

  const { r, s, yParity } = decodeAuthorizationSignature(
    authorizationSignature,
  );

  log('Authorization signature', {
    authorizationSignature,
    r,
    s,
    yParity,
    nonce,
  });

  return [
    {
      address: upgradeContractAddress,
      chainId,
      nonce,
      r,
      s,
      yParity,
    },
  ];
}
