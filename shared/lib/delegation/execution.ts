import { encode } from '@metamask/abi-utils';
import { toHex, type Address, type Hex } from './utils';

const zeroAddress = '0x0000000000000000000000000000000000000000' as const;

export type ExecutionStruct = {
  target: Address;
  value: bigint;
  callData: Hex;
};

/**
 * Creates an execution data structure.
 *
 * @param target - The address to invoke some calldata on.
 * @param value - ETH to send to the address.
 * @param callData - The calldata to invoke on the address.
 * @returns The created execution data structure.
 */
export const createExecution = (
  target: Address = zeroAddress,
  value: bigint = 0n,
  callData: Hex = '0x',
): ExecutionStruct => ({
  target,
  value,
  callData,
});

// Encoded modes
// https://github.com/erc7579/erc7579-implementation/blob/main/src/lib/ModeLib.sol
export const SINGLE_DEFAULT_MODE =
  '0x0000000000000000000000000000000000000000000000000000000000000000';
export const SINGLE_TRY_MODE =
  '0x0001000000000000000000000000000000000000000000000000000000000000';
export const BATCH_DEFAULT_MODE =
  '0x0100000000000000000000000000000000000000000000000000000000000000';
export const BATCH_TRY_MODE =
  '0x0101000000000000000000000000000000000000000000000000000000000000';

export type ExecutionMode =
  | typeof SINGLE_DEFAULT_MODE
  | typeof SINGLE_TRY_MODE
  | typeof BATCH_DEFAULT_MODE
  | typeof BATCH_TRY_MODE;

/**
 * Encodes a single Execution. Used for executing a single Execution in a DeleGator SCA.
 *
 * @param execution - the execution to encode
 * @returns the encoded execution
 */
export const encodeSingleExecution = (execution: ExecutionStruct): Hex => {
  return toHex(
    encode(
      ['address', 'uint256', 'bytes'],
      [execution.target, execution.value, execution.callData],
      true,
    ),
  );
};

/**
 * Encodes a batch of Executions. Used for executing a batch of Executions in a DeleGator SCA.
 * If there's only a single execution, the contracts expect the `encodeSingleExecution` format.
 *
 * @param executions - the executions to encode
 * @returns the encoded executions
 */
export const encodeBatchExecution = (executions: ExecutionStruct[]): Hex => {
  return toHex(
    encode(
      ['(address,uint256,bytes)[]'],
      [executions.map((e) => [e.target, e.value, e.callData])],
    ),
  );
};

/**
 * Encodes the calldata for interacting with the advanced `execute` DeleGator method. Dynamically selects between single and batch execution based on the number of executions.
 *
 * @param executions - the execution(s) to encode
 * @returns the encoded execution(s)
 */
export const encodeExecutionCalldata = (executions: ExecutionStruct[]): Hex => {
  if (executions.length === 0) {
    throw new Error(
      `Error while getting the execution calldatas, executions is empty`,
    );
  }
  if (executions.length === 1) {
    const execution = executions[0];
    return encodeSingleExecution(execution);
  }

  return encodeBatchExecution(executions);
};

/**
 * Encodes the calldata for interacting with `redeemDelegations`. Encodes each batch of executions individually, dynamically selecting between single and batch execution based on the number of executions.
 *
 * @param executionsBatch - the executions to encode
 * @returns the encoded executions
 */
export const encodeExecutionCalldatas = (
  executionsBatch: ExecutionStruct[][],
): Hex[] => {
  if (executionsBatch.length === 0) {
    throw new Error(
      `Error while getting the execution calldatas, executionsBatch is empty`,
    );
  }
  return executionsBatch.map(encodeExecutionCalldata);
};
