import type { Caveat as CoreCaveat, Hex } from '@metamask/delegation-core';

export type Caveat = CoreCaveat<Hex>;
export {
  getDeleGatorEnvironment,
  type DeleGatorEnvironment,
} from './environment';
export {
  createDelegation,
  createOpenDelegation,
  encodeDelegation,
  encodePermissionContexts,
  encodeRedeemDelegations,
  getDelegationHashOffchain,
  toDelegationStruct,
  type Delegation,
  type DelegationStruct,
  type UnsignedDelegation,
} from './delegation';
export {
  BATCH_DEFAULT_MODE,
  BATCH_TRY_MODE,
  SINGLE_DEFAULT_MODE,
  SINGLE_TRY_MODE,
  createExecution,
  encodeBatchExecution,
  encodeExecutionCalldata,
  encodeExecutionCalldatas,
  encodeSingleExecution,
  type ExecutionMode,
  type ExecutionStruct,
} from './execution';
