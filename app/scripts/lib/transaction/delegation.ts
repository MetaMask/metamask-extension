import { MessageParamsTypedData } from '@metamask/signature-controller';
import { Hex, hexToNumber } from '@metamask/utils';
import { SignTypedDataVersion } from '@metamask/keyring-controller';
import { Interface, ParamType, defaultAbiCoder } from '@ethersproject/abi';
import { TransactionControllerInitMessenger } from '../../controller-init/messengers/transaction-controller-messenger';

export type Caveat = {
  enforcer: Hex;
  terms: Hex;
  args: Hex;
};

export type UnsignedDelegation = {
  delegate: Hex;
  delegator: Hex;
  authority: Hex;
  caveats: Caveat[];
  salt: number;
};

export type Delegation = UnsignedDelegation & {
  signature: Hex;
};

export type Execution = {
  target: Hex;
  value: Hex;
  callData: Hex;
};

export enum ExecutionMode {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  BATCH_DEFAULT_MODE = '0x0100000000000000000000000000000000000000000000000000000000000000',
}

export const ROOT_AUTHORITY =
  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';

export const ANY_BENEFICIARY = '0x0000000000000000000000000000000000000a11';

const PRIMARY_TYPE_DELEGATION = 'Delegation';
const DOMAIN_NAME = 'DelegationManager';

const ABI_TYPES_CAVEAT = [
  { type: 'address', name: 'enforcer' },
  { type: 'bytes', name: 'terms' },
  { type: 'bytes', name: 'args' },
];

const ABI_TYPES_DELEGATION = [
  { type: 'address', name: 'delegate' },
  { type: 'address', name: 'delegator' },
  { type: 'bytes32', name: 'authority' },
  { type: 'tuple[]', name: 'caveats', components: ABI_TYPES_CAVEAT },
  { type: 'uint256', name: 'salt' },
  { type: 'bytes', name: 'signature' },
];

const ABI_TYPES_EXECUTION = [
  { type: 'address', name: 'target' },
  { type: 'uint256', name: 'value' },
  { type: 'bytes', name: 'callData' },
];

const ABI_REDEEM_DELEGATIONS = [
  {
    type: 'function',
    name: 'redeemDelegations',
    inputs: [
      {
        name: '_permissionContexts',
        type: 'bytes[]',
        internalType: 'bytes[]',
      },
      {
        name: '_modes',
        type: 'bytes32[]',
        internalType: 'ModeCode[]',
      },
      {
        name: '_executionCallDatas',
        type: 'bytes[]',
        internalType: 'bytes[]',
      },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
];

const TYPES_EIP_712_DOMAIN = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

const TYPES_DELEGATION = {
  EIP712Domain: TYPES_EIP_712_DOMAIN,
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
};

export async function signDelegation({
  chainId,
  delegation,
  from,
  messenger,
}: {
  chainId: Hex;
  delegation: UnsignedDelegation;
  from: Hex;
  messenger: TransactionControllerInitMessenger;
}): Promise<Hex> {
  const data: MessageParamsTypedData = {
    types: TYPES_DELEGATION,
    primaryType: PRIMARY_TYPE_DELEGATION,
    domain: {
      chainId: String(hexToNumber(chainId)),
      name: DOMAIN_NAME,
      version: '1',
      verifyingContract: process.env.DELEGATION_MANAGER_ADDRESS as Hex,
    },
    message: { ...delegation, chainId: hexToNumber(chainId) },
  };

  return (await messenger.call(
    'KeyringController:signTypedMessage',
    {
      from,
      data,
    },
    SignTypedDataVersion.V4,
  )) as Hex;
}

export function encodeRedeemDelegations(
  delegations: Delegation[][],
  modes: ExecutionMode[],
  executions: Execution[][],
): Hex {
  const redeemDelegationsInterface = new Interface(ABI_REDEEM_DELEGATIONS);

  return redeemDelegationsInterface.encodeFunctionData('redeemDelegations', [
    encodePermissionContexts(delegations),
    modes,
    encodeExecutionCalldatas(executions),
  ]) as Hex;
}

function encodePermissionContexts(permissionContexts: Delegation[][]) {
  const encodedDelegations = permissionContexts.map((delegationChain) =>
    encodeDelegation(delegationChain),
  );

  return encodedDelegations;
}

function encodeExecutionCalldatas(executionsBatch: Execution[][]): Hex[] {
  return executionsBatch.map(encodeBatchExecution);
}

function encodeBatchExecution(executions: Execution[]): Hex {
  return defaultAbiCoder.encode(
    [
      ParamType.from({
        components: ABI_TYPES_EXECUTION,
        name: 'executions',
        type: 'tuple[]',
      }),
    ],
    [executions],
  ) as Hex;
}

function encodeDelegation(delegations: Delegation[]): Hex {
  return defaultAbiCoder.encode(
    [
      ParamType.from({
        components: ABI_TYPES_DELEGATION,
        name: 'delegations',
        type: 'tuple[]',
      }),
    ],
    [delegations],
  ) as Hex;
}
