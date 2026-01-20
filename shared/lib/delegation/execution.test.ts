import {
  createExecution,
  encodeSingleExecution,
  encodeBatchExecution,
  encodeExecutionCalldata,
  encodeExecutionCalldatas,
  type ExecutionStruct,
  SINGLE_DEFAULT_MODE,
  SINGLE_TRY_MODE,
  BATCH_DEFAULT_MODE,
  BATCH_TRY_MODE,
} from './execution';
import { isHex, type Hex } from './utils';

const zeroAddress = '0x0000000000000000000000000000000000000000' as Hex;

describe('execution', () => {
  describe('createExecution', () => {
    it('should create an execution with default values', () => {
      const result = createExecution();
      expect(result).toStrictEqual({
        target: zeroAddress,
        value: 0n,
        callData: '0x',
      });
    });

    it('should create an execution with provided values', () => {
      const target = '0x1234567890123456789012345678901234567890' as Hex;
      const value = 1000n;
      const callData = '0xabcdef' as Hex;

      const result = createExecution(target, value, callData);
      expect(result).toStrictEqual({
        target,
        value,
        callData,
      });
    });
  });

  describe('encodeSingleExecution', () => {
    it('should encode a single execution', () => {
      const execution: ExecutionStruct = {
        target: '0x1234567890123456789012345678901234567890',
        value: 1000n,
        callData: '0xabcdef',
      };

      const result = encodeSingleExecution(execution);
      expect(isHex(result)).toBe(true);
      expect(result).toContain(execution.target.slice(2));
      expect(result).toContain(execution.callData.slice(2));
    });
  });

  describe('encodeBatchExecution', () => {
    it('should encode multiple executions', () => {
      const executions: ExecutionStruct[] = [
        {
          target: '0x1234567890123456789012345678901234567890',
          value: 1000n,
          callData: '0xabcdef',
        },
        {
          target: '0x0987654321098765432109876543210987654321',
          value: 2000n,
          callData: '0x123456',
        },
      ];

      const result = encodeBatchExecution(executions);
      expect(isHex(result)).toBe(true);
      expect(result).toContain(executions[0].target.slice(2));
      expect(result).toContain(executions[1].target.slice(2));
    });
  });

  describe('encodeExecutionCalldata', () => {
    it('should encode a single execution', () => {
      const execution: ExecutionStruct = {
        target: '0x1234567890123456789012345678901234567890',
        value: 1000n,
        callData: '0xabcdef',
      };

      const result = encodeExecutionCalldata([execution]);
      expect(isHex(result)).toBe(true);
      expect(result).toContain(execution.target.slice(2));
      expect(result).toContain(execution.callData.slice(2));
    });

    it('should encode multiple executions', () => {
      const executions: ExecutionStruct[] = [
        {
          target: '0x1234567890123456789012345678901234567890' as const,
          value: 1000n,
          callData: '0xabcdef' as const,
        },
        {
          target: '0x0987654321098765432109876543210987654321' as const,
          value: 2000n,
          callData: '0x123456' as const,
        },
      ];

      const result = encodeExecutionCalldata(executions);
      expect(isHex(result)).toBe(true);
      expect(result).toContain(executions[0].target.slice(2));
      expect(result).toContain(executions[1].target.slice(2));
    });

    it('should fail when executions array is empty', () => {
      expect(() => encodeExecutionCalldata([])).toThrow(
        'Error while getting the execution calldatas, executions is empty',
      );
    });
  });

  describe('encodeExecutionCalldatas', () => {
    it('should encode multiple execution batches', () => {
      const expectedExecutionCalldatas = [
        '0x000000000000000000000000016345785d89ffff0000000000000000000000000000000000000000000000000000000000002b677465737431',
        '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000016345785d89ffff0000000000000000000000000000000000000000000000000000000000002b670000000000000000000000000000000000000000000000000000000000000060000000000000000000000000000000000000000000000000000000000000000574657374310000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000027797f26d671c700000000000000000000000000000000000000000000000000000000000056ce000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000057465737432000000000000000000000000000000000000000000000000000000',
      ];

      const execution1: ExecutionStruct = {
        target: '0x000000000000000000000000016345785d89Ffff',
        value: 11111n,
        callData: '0x7465737431',
      };

      const execution2: ExecutionStruct = {
        target: '0x0000000000000000000000000027797F26D671c7',
        value: 22222n,
        callData: '0x7465737432',
      };

      const executionsBatch = [[execution1], [execution1, execution2]];
      const result = encodeExecutionCalldatas(executionsBatch);

      expect(result).toHaveLength(2);
      expect(isHex(result[0])).toBe(true);
      expect(isHex(result[1])).toBe(true);
      expect(result[0]).toBe(expectedExecutionCalldatas[0]);
      expect(result[1]).toBe(expectedExecutionCalldatas[1]);
    });

    it('should fail when executions batch is empty', () => {
      const executionsBatch: ExecutionStruct[][] = [];
      expect(() => encodeExecutionCalldatas(executionsBatch)).toThrow(
        'Error while getting the execution calldatas, executionsBatch is empty',
      );
    });

    it('should fail when a batch contains empty executions array', () => {
      const executionsBatch: ExecutionStruct[][] = [[]];
      expect(() => encodeExecutionCalldatas(executionsBatch)).toThrow(
        'Error while getting the execution calldatas, executions is empty',
      );
    });
  });

  describe('execution modes', () => {
    it('should have correct values for execution modes', () => {
      expect(SINGLE_DEFAULT_MODE).toBe(
        '0x0000000000000000000000000000000000000000000000000000000000000000',
      );
      expect(SINGLE_TRY_MODE).toBe(
        '0x0001000000000000000000000000000000000000000000000000000000000000',
      );
      expect(BATCH_DEFAULT_MODE).toBe(
        '0x0100000000000000000000000000000000000000000000000000000000000000',
      );
      expect(BATCH_TRY_MODE).toBe(
        '0x0101000000000000000000000000000000000000000000000000000000000000',
      );
    });
  });
});
