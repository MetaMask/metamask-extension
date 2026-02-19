import type { Hex } from '../utils';
import type { DeleGatorEnvironment } from '..';
import { timestampBuilder } from './timestampBuilder';

const mockEnvironment: DeleGatorEnvironment = {
  DelegationManager: '0x1234567890123456789012345678901234567890' as Hex,
  EIP7702StatelessDeleGatorImpl: '0x1234567890123456789012345678901234567890' as Hex,
  EntryPoint: '0x1234567890123456789012345678901234567890' as Hex,
  SimpleFactory: '0x1234567890123456789012345678901234567890' as Hex,
  implementations: {},
  caveatEnforcers: {
    TimestampEnforcer: '0xTimestampEnforcerAddress0000000000000000' as Hex,
  },
};

describe('timestampBuilder', () => {
  it('should create a caveat with valid timestamps', () => {
    const result = timestampBuilder(mockEnvironment, 1704067200n, 1706745600n);

    expect(result).toEqual({
      enforcer: mockEnvironment.caveatEnforcers.TimestampEnforcer,
      terms: expect.any(String),
      args: '0x',
    });

    // Terms should be 32 bytes (64 hex chars + 0x prefix)
    expect(result.terms).toMatch(/^0x[a-fA-F0-9]{64}$/);
  });

  it('should allow zero for notBefore (no start restriction)', () => {
    const result = timestampBuilder(mockEnvironment, 0n, 1706745600n);

    expect(result).toEqual({
      enforcer: mockEnvironment.caveatEnforcers.TimestampEnforcer,
      terms: expect.any(String),
      args: '0x',
    });
  });

  it('should allow zero for notAfter (no end restriction)', () => {
    const result = timestampBuilder(mockEnvironment, 1704067200n, 0n);

    expect(result).toEqual({
      enforcer: mockEnvironment.caveatEnforcers.TimestampEnforcer,
      terms: expect.any(String),
      args: '0x',
    });
  });

  it('should allow both zeros (no time restrictions)', () => {
    const result = timestampBuilder(mockEnvironment, 0n, 0n);

    expect(result).toEqual({
      enforcer: mockEnvironment.caveatEnforcers.TimestampEnforcer,
      terms: expect.any(String),
      args: '0x',
    });
  });

  it('should throw for negative notBefore', () => {
    expect(() => timestampBuilder(mockEnvironment, -1n, 1706745600n)).toThrow(
      'Invalid notBefore: must be a non-negative bigint',
    );
  });

  it('should throw for negative notAfter', () => {
    expect(() => timestampBuilder(mockEnvironment, 1704067200n, -1n)).toThrow(
      'Invalid notAfter: must be a non-negative bigint',
    );
  });

  it('should throw when notAfter is less than notBefore (both non-zero)', () => {
    expect(() => timestampBuilder(mockEnvironment, 1706745600n, 1704067200n)).toThrow(
      'Invalid timestamps: notAfter must be greater than notBefore',
    );
  });

  it('should throw when notAfter equals notBefore (both non-zero)', () => {
    expect(() => timestampBuilder(mockEnvironment, 1704067200n, 1704067200n)).toThrow(
      'Invalid timestamps: notAfter must be greater than notBefore',
    );
  });
});
