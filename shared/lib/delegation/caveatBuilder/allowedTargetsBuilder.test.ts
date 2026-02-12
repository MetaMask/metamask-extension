import type { DeleGatorEnvironment } from '..';
import type { Hex } from '../utils';
import { allowedTargetsBuilder } from './allowedTargetsBuilder';

describe('allowedTargetsBuilder', () => {
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
      AllowedTargetsEnforcer: '0x1234567890123456789012345678901234567890',
    },
  };

  it('should create a caveat with a valid target address', () => {
    const targets = ['0x1234567890123456789012345678901234567890'] as Hex[];

    const caveat = allowedTargetsBuilder(mockEnvironment, targets);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.AllowedTargetsEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('should create a caveat with multiple valid target addresses', () => {
    const targets = [
      '0x1234567890123456789012345678901234567890',
      '0x0987654321098765432109876543210987654321',
      '0xabcdef0123456789abcdef0123456789abcdef01',
    ] as Hex[];

    const caveat = allowedTargetsBuilder(mockEnvironment, targets);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.AllowedTargetsEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('should throw an error if no targets are provided', () => {
    const targets: Hex[] = [];

    expect(() => {
      allowedTargetsBuilder(mockEnvironment, targets);
    }).toThrow('Invalid targets: must provide at least one target address');
  });

  it('should throw an error if any target is not a valid address', () => {
    const targets = [
      '0x1234567890123456789012345678901234567890',
      'not-a-valid-address',
    ] as Hex[];

    expect(() => {
      allowedTargetsBuilder(mockEnvironment, targets);
    }).toThrow('Invalid targets: must be valid addresses');
  });

  it('should throw an error if any target is too short', () => {
    const targets = [
      '0x1234567890123456789012345678901234567890',
      '0x123456789012345678901234567890123456789', // 39 chars instead of 40
    ] as Hex[];

    expect(() => {
      allowedTargetsBuilder(mockEnvironment, targets);
    }).toThrow('Invalid targets: must be valid addresses');
  });

  it('should throw an error if any target is too long', () => {
    const targets = [
      '0x1234567890123456789012345678901234567890',
      '0x12345678901234567890123456789012345678901', // 41 chars instead of 40
    ] as Hex[];

    expect(() => {
      allowedTargetsBuilder(mockEnvironment, targets);
    }).toThrow('Invalid targets: must be valid addresses');
  });

  it('should throw an error if any target has invalid characters', () => {
    const targets = [
      '0x1234567890123456789012345678901234567890',
      '0x123456789012345678901234567890123456789g', // 'g' is not a valid hex character
    ] as Hex[];

    expect(() => {
      allowedTargetsBuilder(mockEnvironment, targets);
    }).toThrow('Invalid targets: must be valid addresses');
  });
});
