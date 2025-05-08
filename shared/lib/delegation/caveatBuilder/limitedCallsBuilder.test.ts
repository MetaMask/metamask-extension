import type { DeleGatorEnvironment } from '..';
import { limitedCallsBuilder } from './limitedCallsBuilder';

describe('limitedCallsBuilder', () => {
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

  it('should create a caveat with a valid limit', () => {
    const limit = 5;

    const caveat = limitedCallsBuilder(mockEnvironment, limit);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.LimitedCallsEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('should create a caveat with a large limit', () => {
    const limit = 1000000;

    const caveat = limitedCallsBuilder(mockEnvironment, limit);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.LimitedCallsEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('should create a caveat with a small limit', () => {
    const limit = 1;

    const caveat = limitedCallsBuilder(mockEnvironment, limit);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.LimitedCallsEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('should throw an error if limit is not an integer', () => {
    const limit = 5.5;

    expect(() => {
      limitedCallsBuilder(mockEnvironment, limit);
    }).toThrow('Invalid limit: must be an integer');
  });

  it('should throw an error if limit is zero', () => {
    const limit = 0;

    expect(() => {
      limitedCallsBuilder(mockEnvironment, limit);
    }).toThrow('Invalid limit: must be a positive integer');
  });

  it('should throw an error if limit is negative', () => {
    const limit = -5;

    expect(() => {
      limitedCallsBuilder(mockEnvironment, limit);
    }).toThrow('Invalid limit: must be a positive integer');
  });
});
