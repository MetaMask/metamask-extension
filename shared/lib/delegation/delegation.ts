import { encode } from '@metamask/abi-utils';
import { getChecksumAddress, type Hex } from '@metamask/utils';
import {
  Delegation as CoreDelegationStruct,
  ROOT_AUTHORITY,
  ANY_BENEFICIARY,
  hashDelegation,
} from '@metamask/delegation-core';
import { resolveCaveats, type Caveats } from './caveatBuilder';
import { concat, toFunctionSelector, toHex } from './utils';
import {
  encodeExecutionCalldatas,
  ExecutionMode,
  ExecutionStruct,
} from './execution';

export {
  ROOT_AUTHORITY,
  ANY_BENEFICIARY,
  DELEGATION_TYPEHASH,
} from '@metamask/delegation-core';

/**
 * The function selector for the redeemDelegations function
 */
export const REDEEM_DELEGATIONS_SELECTOR = '0xcef6d209' as Hex;

/**
 * Converts a Delegation to a DelegationStruct.
 * The DelegationStruct is the format used in the Delegation Framework.
 *
 * @param delegation - the delegation to format
 * @returns
 */
export const toDelegationStruct = (
  delegation: Delegation,
): DelegationStruct => {
  const caveats = delegation.caveats.map((caveat) => ({
    enforcer: getChecksumAddress(caveat.enforcer),
    terms: caveat.terms,
    args: caveat.args,
  }));

  const salt = delegation.salt === '0x' ? 0n : BigInt(delegation.salt);

  return {
    delegate: getChecksumAddress(delegation.delegate),
    delegator: getChecksumAddress(delegation.delegator),
    authority:
      delegation.authority === undefined
        ? ROOT_AUTHORITY
        : delegation.authority,
    caveats,
    salt,
    signature: delegation.signature,
  };
};

/**
 * Represents a DelegationStruct as defined in the Delegation Framework.
 * This uses Hex strings for all byte fields and bigint for salt, which is useful
 * for on-chain operations and EIP-712 signing.
 *
 * This type is based on DelegationStruct from @metamask/delegation-core but
 * constrains all byte fields to Hex strings for consistency within MetaMask Extension.
 */
export type DelegationStruct = CoreDelegationStruct<Hex>;

/**
 * Represents a delegation with Hex string for salt (legacy format).
 * This type maintains backward compatibility for code that expects salt as a Hex string.
 *
 * @property delegate - The address of the entity receiving the delegation.
 * @property delegator - The address of the entity granting the delegation.
 * @property authority - The authority under which this delegation is granted. For root delegations, this is ROOT_AUTHORITY.
 * @property caveats - An array of restrictions or conditions applied to this delegation.
 * @property salt - A unique value to prevent replay attacks and ensure uniqueness of the delegation (as Hex string).
 * @property signature - The cryptographic signature validating this delegation.
 */
export type Delegation = Omit<DelegationStruct, 'salt'> & {
  salt: Hex;
};

export type UnsignedDelegation = Omit<Delegation, 'signature'>;

/**
 * ABI Encodes a delegation.
 *
 * @param delegations
 * @returns
 */
export const encodeDelegation = (delegations: Delegation[]): Hex => {
  const flatDelegations = delegations
    .map(toDelegationStruct)
    .map((delegation) => [
      delegation.delegate,
      delegation.delegator,
      delegation.authority,
      delegation.caveats.map((c) => [c.enforcer, c.terms, c.args]),
      delegation.salt,
      delegation.signature,
    ]);
  return toHex(
    encode(
      ['(address,address,bytes32,(address,bytes,bytes)[],uint256,bytes)[]'],
      [flatDelegations],
    ),
  );
};

/**
 * ABI Encodes the delegation chains to generate the encoded permissions contexts.
 *
 * @param delegations
 * @returns
 */
export const encodePermissionContexts = (delegations: Delegation[][]) => {
  const encodedDelegations = delegations.map((delegationChain) =>
    encodeDelegation(delegationChain),
  );
  return encodedDelegations;
};

/**
 * This function is used to get the hash of the Delegation parameters.
 * Uses the hashDelegation function from @metamask/delegation-core.
 *
 * @param input - The Delegation parameters to be hashed.
 * @returns Returns the hash of the Delegation parameters.
 */
export const getDelegationHashOffchain = (input: Delegation): Hex => {
  const delegationStruct = toDelegationStruct(input);
  return hashDelegation(delegationStruct);
};

type BaseCreateDelegationOptions = {
  from: Hex;
  caveats: Caveats;
  parentDelegation?: Delegation | Hex;
};

/**
 * Options for creating a specific delegation
 */
export type CreateDelegationOptions = BaseCreateDelegationOptions & {
  to: Hex;
};

/**
 * Options for creating an open delegation
 */
export type CreateOpenDelegationOptions = BaseCreateDelegationOptions;

/**
 * Resolves the authority for a delegation based on the parent delegation
 *
 * @param parentDelegation - The parent delegation or its hash
 * @returns The resolved authority hash
 */
export const resolveAuthority = (parentDelegation?: Delegation | Hex): Hex => {
  if (!parentDelegation) {
    return ROOT_AUTHORITY;
  }

  if (typeof parentDelegation === 'string') {
    return parentDelegation;
  }

  return getDelegationHashOffchain(parentDelegation);
};

/**
 * Creates a delegation with specific delegate
 *
 * @param options - The options for creating the delegation
 * @returns The created delegation data structure
 */
export const createDelegation = (
  options: CreateDelegationOptions,
): Delegation => {
  return {
    delegate: options.to,
    delegator: options.from,
    authority: resolveAuthority(options.parentDelegation),
    caveats: resolveCaveats(options.caveats),
    salt: `0x${Math.random().toString(16).slice(2, 10)}`,
    signature: '0x',
  };
};

/**
 * Creates an open delegation that can be redeemed by any delegate
 *
 * @param options - The options for creating the open delegation
 * @returns The created delegation data structure
 */
export const createOpenDelegation = (
  options: CreateOpenDelegationOptions,
): Delegation => {
  return {
    delegate: ANY_BENEFICIARY,
    delegator: options.from,
    authority: resolveAuthority(options.parentDelegation),
    caveats: resolveCaveats(options.caveats),
    salt: '0x',
    signature: '0x',
  };
};

/**
 * Encodes the calldata for a disableDelegation(delegation) call.
 *
 * @param params
 * @param params.delegation - The delegation to disable.
 * @returns The encoded calldata.
 */
export const encodeDisableDelegation = ({
  delegation,
}: {
  delegation: Delegation;
}) => {
  const delegationStruct = toDelegationStruct(delegation);

  const encodedSignature = toFunctionSelector(
    'disableDelegation((address,address,bytes32,(address,bytes,bytes)[],uint256,bytes))',
  );

  const encodedData = toHex(
    encode(
      ['(address,address,bytes32,(address,bytes,bytes)[],uint256,bytes)'],
      [
        [
          delegationStruct.delegate,
          delegationStruct.delegator,
          delegationStruct.authority,
          delegationStruct.caveats.map((c) => [c.enforcer, c.terms, c.args]),
          delegationStruct.salt,
          delegationStruct.signature,
        ],
      ],
    ),
  );

  return concat([encodedSignature, encodedData]);
};

/**
 * Encodes the calldata for a disabledDelegations(bytes32) view call.
 * This is used to check if a delegation has already been disabled on-chain.
 *
 * @param params
 * @param params.delegationHash - The hash of the delegation to check.
 * @returns The encoded calldata.
 */
export const encodeDisabledDelegationsCheck = ({
  delegationHash,
}: {
  delegationHash: Hex;
}): Hex => {
  const encodedSignature = toFunctionSelector('disabledDelegations(bytes32)');
  const encodedData = toHex(encode(['bytes32'], [delegationHash]));
  return concat([encodedSignature, encodedData]);
};

/**
 * Decodes the result from a disabledDelegations(bytes32) view call.
 *
 * @param result - The raw hex result from the eth_call.
 * @returns True if the delegation is disabled, false otherwise.
 */
export const decodeDisabledDelegationsResult = (result: Hex): boolean => {
  if (!result || result === '0x') {
    return false;
  }
  return BigInt(result) !== 0n;
};

/**
 * Encodes the calldata for a redeemDelegations(delegations,modes,executions) call.
 *
 * @param params
 * @param params.delegations - The delegations to redeem.
 * @param params.modes - The modes to redeem the delegations with.
 * @param params.executions - The executions to redeem the delegations with.
 * @returns The encoded calldata.
 */
export const encodeRedeemDelegations = ({
  delegations,
  modes,
  executions,
}: {
  delegations: Delegation[][];
  modes: ExecutionMode[];
  executions: ExecutionStruct[][];
}) => {
  const encodedSignature = toFunctionSelector(
    'redeemDelegations(bytes[],bytes32[],bytes[])',
  );

  const contexts = encodePermissionContexts(delegations);
  const calldatas = encodeExecutionCalldatas(executions);

  const encodedData = toHex(
    encode(['bytes[]', 'bytes32[]', 'bytes[]'], [contexts, modes, calldatas]),
  );

  return concat([encodedSignature, encodedData]);
};
