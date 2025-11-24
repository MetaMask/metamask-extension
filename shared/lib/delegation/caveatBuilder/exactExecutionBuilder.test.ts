import { Hex } from '@metamask/utils';
import type { DeleGatorEnvironment } from '..';
import { exactExecutionBuilder } from './exactExecutionBuilder';

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
    LimitedCallsEnforcer: '0x1234567890123456789012345678901234567890',
  },
};

describe('exactExecutionBuilder', () => {
  const testTo = '0x1234567890123456789012345678901234567890';
  const testValue = `0x${BigInt(10 * 10 ** 9).toString(16)}` as Hex;
  const testData = '0x1234567890123456789012345678901234567890';

  it('should create a caveat with a valid exact execution', () => {
    const caveat = exactExecutionBuilder(
      mockEnvironment,
      testTo,
      testValue,
      testData,
    );

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.ExactExecutionEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
    expect(caveat.terms.slice(0, 42)).toStrictEqual(testTo);
    // the the zero-padded value is encoded from 42 to 42 + 64
    expect(caveat.terms.slice(42 + 64)).toStrictEqual(testData.slice(2)); // 0x removed from the appended data
  });

  it('should throw an error if to is not an address', () => {
    const testToOverride =
      '0x12345678901234567890123456789012345678901234123412341234'; // longer than 42 chars

    expect(() => {
      exactExecutionBuilder(
        mockEnvironment,
        testToOverride,
        testValue,
        testData,
      );
    }).toThrow('Invalid to: must be a valid address');
  });

  it('should throw an error if value is not positive', () => {
    const testValueOverride = '-0x012123' as Hex; // negative value

    expect(() => {
      exactExecutionBuilder(
        mockEnvironment,
        testTo,
        testValueOverride,
        testData,
      );
    }).toThrow('Invalid value: must be a positive integer or zero');
  });

  // remaining failure modes should be avoided by respecting the types
});
