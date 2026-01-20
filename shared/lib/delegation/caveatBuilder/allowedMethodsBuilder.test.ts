import type { DeleGatorEnvironment } from '..';
import { allowedMethodsBuilder } from './allowedMethodsBuilder';

describe('allowedMethodsBuilder', () => {
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
      AllowedMethodsEnforcer: '0x1234567890123456789012345678901234567890',
    },
  };

  it('should create a caveat with valid function selectors', () => {
    const selectors = ['transfer(address,uint256)'];

    const caveat = allowedMethodsBuilder(mockEnvironment, selectors);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.AllowedMethodsEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('should create a caveat with multiple function selectors', () => {
    const selectors = [
      'transfer(address,uint256)',
      'approve(address,uint256)',
      'transferFrom(address,address,uint256)',
    ];

    const caveat = allowedMethodsBuilder(mockEnvironment, selectors);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.AllowedMethodsEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('should create a caveat with hex function selectors', () => {
    const selectors = ['0xa9059cbb']; // transfer(address,uint256)

    const caveat = allowedMethodsBuilder(mockEnvironment, selectors);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.AllowedMethodsEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('should throw an error if no selectors are provided', () => {
    const selectors: string[] = [];

    expect(() => {
      allowedMethodsBuilder(mockEnvironment, selectors);
    }).toThrow('Invalid selectors: must provide at least one selector');
  });

  it('should throw an error if a hex selector is invalid', () => {
    const selectors = ['0xinvalid'];

    expect(() => {
      allowedMethodsBuilder(mockEnvironment, selectors);
    }).toThrow(
      'Invalid selector: must be a 4 byte hex string or abi function signature',
    );
  });

  it('should throw an error if a hex selector is not 4 bytes', () => {
    const selectors = ['0x123456']; // 3 bytes

    expect(() => {
      allowedMethodsBuilder(mockEnvironment, selectors);
    }).toThrow(
      'Invalid selector: must be a 4 byte hex string or abi function signature',
    );
  });

  it('should handle mixed selectors', () => {
    const selectors = [
      'transfer(address,uint256)',
      '0xa9059cbb', // transfer(address,uint256)
    ];

    const caveat = allowedMethodsBuilder(mockEnvironment, selectors);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.AllowedMethodsEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });
});
