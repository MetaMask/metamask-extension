import { Hex } from '@metamask/utils';

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

export const PRIMARY_TYPE_DELEGATION = 'Delegation';
