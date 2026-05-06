import { Hex } from '@metamask/utils';
import type { DeleGatorEnvironment } from '..';
import { exactExecutionBatchBuilder } from './exactExecutionBatchBuilder';

const ENFORCER_ADDRESS_MOCK = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const mockEnvironment: DeleGatorEnvironment = {
  DelegationManager: '0x1234567890123456789012345678901234567890',
  EntryPoint: '0x2345678901234567890123456789012345678901',
  SimpleFactory: '0x3456789012345678901234567890123456789012',
  EIP7702StatelessDeleGatorImpl: '0x1234567890123456789012345678901234567890',
  implementations: {
    MultiSigDeleGatorImpl: '0x4567890123456789012345678901234567890123',
    HybridDeleGatorImpl: '0x5678901234567890123456789012345678901234',
  },
  caveatEnforcers: {
    ExactExecutionBatchEnforcer: ENFORCER_ADDRESS_MOCK,
  },
};

describe('exactExecutionBatchBuilder', () => {
  const testTo1 = '0x1234567890123456789012345678901234567890';
  const testTo2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
  const testValue = `0x${BigInt(10 * 10 ** 9).toString(16)}` as Hex;
  const testData = '0x1234567890123456789012345678901234567890';

  it('creates a caveat with valid batch executions', () => {
    const caveat = exactExecutionBatchBuilder(mockEnvironment, [
      { to: testTo1, value: testValue, data: testData },
      { to: testTo2, value: '0x0', data: undefined },
    ]);

    expect(caveat.enforcer).toBe(ENFORCER_ADDRESS_MOCK);
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('creates a caveat with a single execution', () => {
    const caveat = exactExecutionBatchBuilder(mockEnvironment, [
      { to: testTo1, value: testValue, data: testData },
    ]);

    expect(caveat.enforcer).toBe(ENFORCER_ADDRESS_MOCK);
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('normalizes undefined data to 0x', () => {
    const caveat = exactExecutionBatchBuilder(mockEnvironment, [
      { to: testTo1, value: '0x0', data: undefined },
    ]);

    expect(caveat.terms).toBeDefined();
  });

  it('normalizes 0x data to 0x', () => {
    const caveat = exactExecutionBatchBuilder(mockEnvironment, [
      { to: testTo1, value: '0x0', data: '0x' },
    ]);

    expect(caveat.terms).toBeDefined();
  });

  it('throws if to is not a valid address at index 0', () => {
    expect(() =>
      exactExecutionBatchBuilder(mockEnvironment, [
        { to: 'not-an-address', value: testValue, data: testData },
      ]),
    ).toThrow('Index 0 - Invalid to: must be a valid address');
  });

  it('throws if to is not a valid address at index 1', () => {
    expect(() =>
      exactExecutionBatchBuilder(mockEnvironment, [
        { to: testTo1, value: testValue, data: testData },
        { to: 'invalid', value: '0x0', data: undefined },
      ]),
    ).toThrow('Index 1 - Invalid to: must be a valid address');
  });

  it('throws if value is negative', () => {
    expect(() =>
      exactExecutionBatchBuilder(mockEnvironment, [
        { to: testTo1, value: '-0x1', data: testData },
      ]),
    ).toThrow('Index 0 - Invalid value: must be a positive integer or zero');
  });

  it('throws if data is invalid hex', () => {
    expect(() =>
      exactExecutionBatchBuilder(mockEnvironment, [
        { to: testTo1, value: '0x0', data: '0xZZZZ' },
      ]),
    ).toThrow('Index 0 - Invalid data: must be a valid hex string');
  });
});
