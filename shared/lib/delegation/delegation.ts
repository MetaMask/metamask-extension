import {
  type Hex,
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
  toHex,
  TypedData,
  AbiParameter,
  getAddress,
} from 'viem';
import {
  CAVEAT_ABI_TYPE_COMPONENTS,
  Caveat,
  getCaveatArrayPacketHash,
} from './caveat';

import { type Caveats, resolveCaveats } from './caveatBuilder';

/**
 * The ABI type components of a Delegation.
 */
export const DELEGATION_ABI_TYPE_COMPONENTS = [
  { type: 'address', name: 'delegate' },
  { type: 'address', name: 'delegator' },
  { type: 'bytes32', name: 'authority' },
  { type: 'tuple[]', name: 'caveats', components: CAVEAT_ABI_TYPE_COMPONENTS },
  { type: 'uint256', name: 'salt' },
  { type: 'bytes', name: 'signature' },
];

/**
 * TypedData to be used when signing a Delegation. Delegation value for `signature` and Caveat values for `args` are omitted as they cannot be known at signing time.
 */
export const SIGNABLE_DELEGATION_TYPED_DATA: TypedData = {
  Caveat: [
    { name: 'enforcer', type: 'address' },
    { name: 'terms', type: 'bytes' },
  ],
  Delegation: [
    { name: 'delegate', type: 'address' },
    { name: 'delegator', type: 'address' },
    { name: 'authority', type: 'bytes32' },
    { name: 'caveats', type: 'Caveat[]' },
    { name: 'salt', type: 'uint256' },
  ],
} as const;

/**
 * The ABI type for a full delegation.
 */
export const DELEGATION_ARRAY_ABI_TYPE: AbiParameter = {
  type: 'tuple[]',
  components: DELEGATION_ABI_TYPE_COMPONENTS,
} as const;

/**
 * To be used on a delegation as the root authority.
 */
export const ROOT_AUTHORITY =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

/**
 * To be used in the allowList field of a gas delegation so as not to restrict who can redeem the gas delegation.
 */
export const ANY_BENEFICIARY = '0x0000000000000000000000000000000000000a11';

/**
 * To be used when generating a delegation hash to be signed
 * NOTE: signature is omitted from the Delegation typehash
 */
export const DELEGATION_TYPEHASH = keccak256(
  toHex(
    'Delegation(address delegate,address delegator,bytes32 authority,Caveat[] caveats,uint256 salt)Caveat(address enforcer,bytes terms)',
  ),
);

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
    enforcer: getAddress(caveat.enforcer),
    terms: caveat.terms,
    args: caveat.args,
  }));

  const salt = delegation.salt === '0x' ? 0n : BigInt(delegation.salt);

  return {
    delegate: getAddress(delegation.delegate),
    delegator: getAddress(delegation.delegator),
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
 * Represents a delegation that grants permissions from a delegator to a delegate.
 *
 * @property delegate - The address of the entity receiving the delegation.
 * @property delegator - The address of the entity granting the delegation.
 * @property authority - The authority under which this delegation is granted. For root delegations, this is ROOT_AUTHORITY.
 * @property caveats - An array of restrictions or conditions applied to this delegation.
 * @property salt - A unique value to prevent replay attacks and ensure uniqueness of the delegation.
 * @property signature - The cryptographic signature validating this delegation.
 */
export type Delegation = {
  delegate: Hex;
  delegator: Hex;
  authority: Hex;
  caveats: Caveat[];
  salt: Hex;
  signature: Hex;
};

/**
 * Represents a DelegationStruct as defined in the Delegation Framework.
 * This is distinguished from the Delegation type by requiring the salt to be a bigint
 * instead of a Hex string, which is useful for on-chain operations and EIP-712 signing.
 */
export type DelegationStruct = Omit<Delegation, 'salt'> & {
  salt: bigint;
};

/**
 * ABI Encodes a delegation.
 *
 * @param delegations
 * @returns
 */
export const encodeDelegation = (delegations: Delegation[]) => {
  const delegationStructs = delegations.map(toDelegationStruct);

  return encodeAbiParameters(
    [
      {
        components: DELEGATION_ABI_TYPE_COMPONENTS,
        name: 'delegations',
        type: 'tuple[]',
      },
    ],
    [delegationStructs],
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
 * Encodes an array of Delegations for use in a contract call.
 *
 * @param delegations - The array of Delegations to encode.
 * @returns The encoded Delegations as abi parameters.
 */
export const encodeDelegations = (delegations: Delegation[]) =>
  encodeAbiParameters([DELEGATION_ARRAY_ABI_TYPE], [delegations]);

/**
 * This function is used to get the hash of the Delegation parameters.
 *
 * @param input - The Delegation parameters to be hashed.
 * @returns Returns the hash of the Delegation parameters.
 */
export const getDelegationHashOffchain = (input: Delegation): Hex => {
  const delegationStruct = toDelegationStruct(input);

  const encoded = encodeAbiParameters(
    parseAbiParameters('bytes32, address, address, bytes32, bytes32, uint'),
    [
      DELEGATION_TYPEHASH,
      delegationStruct.delegate,
      delegationStruct.delegator,
      delegationStruct.authority,
      getCaveatArrayPacketHash(delegationStruct.caveats),
      delegationStruct.salt,
    ],
  );

  return keccak256(encoded);
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
    salt: '0x',
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
