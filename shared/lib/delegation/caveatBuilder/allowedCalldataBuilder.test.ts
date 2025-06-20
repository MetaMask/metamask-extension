import type { DeleGatorEnvironment } from '..';
import type { Hex } from '../utils';
import { allowedCalldataBuilder } from './allowedCalldataBuilder';

describe('allowedCalldataBuilder', () => {
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
      AllowedCalldataEnforcer: '0x1234567890123456789012345678901234567890',
    },
  };

  it('should create a caveat with valid parameters', () => {
    const startIndex = 0;
    const value = '0x1234';

    const caveat = allowedCalldataBuilder(mockEnvironment, startIndex, value);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.AllowedCalldataEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('should throw an error if value is not a valid hex string', () => {
    const startIndex = 0;
    const value = 'not-a-hex-string';

    expect(() => {
      allowedCalldataBuilder(mockEnvironment, startIndex, value as Hex);
    }).toThrow('Invalid value: must be a valid hex string');
  });

  it('should throw an error if startIndex is negative', () => {
    const startIndex = -1;
    const value = '0x1234';

    expect(() => {
      allowedCalldataBuilder(mockEnvironment, startIndex, value);
    }).toThrow('Invalid startIndex: must be zero or positive');
  });

  it('should throw an error if startIndex is not a whole number', () => {
    const startIndex = 1.5;
    const value = '0x1234';

    expect(() => {
      allowedCalldataBuilder(mockEnvironment, startIndex, value);
    }).toThrow('Invalid startIndex: must be a whole number');
  });

  it('should handle different start indices', () => {
    const startIndex = 10;
    const value = '0x1234';

    const caveat = allowedCalldataBuilder(mockEnvironment, startIndex, value);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.AllowedCalldataEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('should handle different hex values', () => {
    const startIndex = 0;
    const value = '0xabcdef1234567890';

    const caveat = allowedCalldataBuilder(mockEnvironment, startIndex, value);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.AllowedCalldataEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });
});
