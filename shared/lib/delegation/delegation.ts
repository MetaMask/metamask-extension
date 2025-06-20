import { encode } from '@metamask/abi-utils';
import { getChecksumAddress } from '@metamask/utils';
import { keccak } from 'ethereumjs-util';
import { getCaveatArrayPacketHash, type Caveat } from './caveat';
import { resolveCaveats, type Caveats } from './caveatBuilder';
import { concat, toFunctionSelector, toHex, type Hex } from './utils';
import {
  encodeExecutionCalldatas,
  ExecutionMode,
  ExecutionStruct,
} from './execution';
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
export const DELEGATION_TYPEHASH =
  '0x88c1d2ecf185adf710588203a5f263f0ff61be0d33da39792cde19ba9aa4331e' as Hex;

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

export type UnsignedDelegation = Omit<Delegation, 'signature'>;

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
 *
 * @param input - The Delegation parameters to be hashed.
 * @returns Returns the hash of the Delegation parameters.
 */
export const getDelegationHashOffchain = (input: Delegation): Hex => {
  const delegationStruct = toDelegationStruct(input);
  const encoded = encode(
    ['bytes32', 'address', 'address', 'bytes32', 'bytes32', 'uint'],
    [
      DELEGATION_TYPEHASH,
      delegationStruct.delegate,
      delegationStruct.delegator,
      delegationStruct.authority,
      getCaveatArrayPacketHash(delegationStruct.caveats),
      delegationStruct.salt,
    ],
  );
  return toHex(keccak(Buffer.from(encoded)));
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
