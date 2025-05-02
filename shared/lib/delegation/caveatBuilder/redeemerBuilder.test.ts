import type { DeleGatorEnvironment } from '..';
import type { Hex } from '../utils';
import { redeemerBuilder } from './redeemerBuilder';

describe('redeemerBuilder', () => {
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
      RedeemerEnforcer: '0x1234567890123456789012345678901234567890',
    },
  };

  it('should create a caveat with a valid redeemer address', () => {
    const redeemers = ['0x1234567890123456789012345678901234567890'] as Hex[];

    const caveat = redeemerBuilder(mockEnvironment, redeemers);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.RedeemerEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('should create a caveat with multiple valid redeemer addresses', () => {
    const redeemers = [
      '0x44c7E1cbD5a7402bC31Bf637E57d27ff559c66c9',
      '0x2f6fC5E27628158758ae4688BbA809c62713d152',
      '0xD51891b00847cB1497399c34F6F9Ab9a952a6704',
    ] as Hex[];

    const caveat = redeemerBuilder(mockEnvironment, redeemers);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.RedeemerEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();
  });

  it('should throw an error if no redeemers are provided', () => {
    const redeemers: Hex[] = [];

    expect(() => {
      redeemerBuilder(mockEnvironment, redeemers);
    }).toThrow('Invalid redeemers: must specify at least one redeemer address');
  });

  it('should throw an error if any redeemer is not a valid address', () => {
    const redeemers = [
      '0x1234567890123456789012345678901234567890',
      'not-a-valid-address',
    ] as Hex[];

    expect(() => {
      redeemerBuilder(mockEnvironment, redeemers);
    }).toThrow('Invalid redeemers: must be a valid address');
  });

  it('should throw an error if any redeemer is too short', () => {
    const redeemers = [
      '0x1234567890123456789012345678901234567890',
      '0x123456789012345678901234567890123456789', // 39 chars instead of 40
    ] as Hex[];

    expect(() => {
      redeemerBuilder(mockEnvironment, redeemers);
    }).toThrow('Invalid redeemers: must be a valid address');
  });

  it('should throw an error if any redeemer is too long', () => {
    const redeemers = [
      '0x1234567890123456789012345678901234567890',
      '0x12345678901234567890123456789012345678901', // 41 chars instead of 40
    ] as Hex[];

    expect(() => {
      redeemerBuilder(mockEnvironment, redeemers);
    }).toThrow('Invalid redeemers: must be a valid address');
  });

  it('should throw an error if any redeemer has invalid characters', () => {
    const redeemers = [
      '0x1234567890123456789012345678901234567890',
      '0x123456789012345678901234567890123456789g', // 'g' is not a valid hex character
    ] as Hex[];

    expect(() => {
      redeemerBuilder(mockEnvironment, redeemers);
    }).toThrow('Invalid redeemers: must be a valid address');
  });

  it('should convert addresses to lowercase', () => {
    const redeemers = [
      '0x44c7E1cbD5a7402bC31Bf637E57d27ff559c66c9',
      '0x2f6fC5E27628158758ae4688BbA809c62713d152',
    ] as Hex[];

    const caveat = redeemerBuilder(mockEnvironment, redeemers);

    expect(caveat.enforcer).toBe(
      mockEnvironment.caveatEnforcers.RedeemerEnforcer,
    );
    expect(caveat.args).toBe('0x');
    expect(caveat.terms).toBeDefined();

    // The terms should contain the lowercase version of the addresses
    const terms = caveat.terms as string;
    expect(terms).toContain('44c7e1cbd5a7402bc31bf637e57d27ff559c66c9');
    expect(terms).toContain('2f6fc5e27628158758ae4688bba809c62713d152');
  });
});
