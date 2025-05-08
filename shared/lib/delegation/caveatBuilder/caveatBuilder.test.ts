import { createCaveat } from '../caveat';
import { toHex, type Hex } from '../utils';
import type { DeleGatorEnvironment } from '../environment';
import { CaveatBuilder } from './caveatBuilder';

describe('CaveatBuilder', () => {
  const mockEnvironment: DeleGatorEnvironment = {
    DelegationManager: '0x1234567890123456789012345678901234567890' as Hex,
    EntryPoint: '0x1234567890123456789012345678901234567890' as Hex,
    SimpleFactory: '0x1234567890123456789012345678901234567890' as Hex,
    EIP7702StatelessDeleGatorImpl:
      '0x1234567890123456789012345678901234567890' as Hex,
    implementations: {
      MultiSigDeleGatorImpl:
        '0x1234567890123456789012345678901234567890' as Hex,
      HybridDeleGatorImpl: '0x1234567890123456789012345678901234567890' as Hex,
    },
    caveatEnforcers: {
      AllowedMethodsEnforcer:
        '0x1234567890123456789012345678901234567890' as Hex,
      AllowedTargetsEnforcer:
        '0x2345678901234567890123456789012345678901' as Hex,
      AllowedCalldataEnforcer:
        '0x3456789012345678901234567890123456789012' as Hex,
      LimitedCallsEnforcer: '0x4567890123456789012345678901234567890123' as Hex,
      RedeemerEnforcer: '0x5678901234567890123456789012345678901234' as Hex,
      RevokerEnforcer: '0x6789012345678901234567890123456789012345' as Hex,
    },
  };

  const mockCaveat = createCaveat(
    mockEnvironment.caveatEnforcers.AllowedMethodsEnforcer,
    toHex('0x12345678'),
  );

  describe('constructor', () => {
    it('should create a new CaveatBuilder instance', () => {
      const builder = new CaveatBuilder(mockEnvironment);
      expect(builder).toBeInstanceOf(CaveatBuilder);
    });

    it('should initialize with empty results array', () => {
      const builder = new CaveatBuilder(mockEnvironment);
      expect(() => builder.build()).toThrow(
        'No caveats found. If you definitely want to create an empty caveat collection, set `allowEmptyCaveats`.',
      );
    });

    it('should initialize with provided caveats', () => {
      const builder = new CaveatBuilder(mockEnvironment, {}, {}, [mockCaveat]);
      const result = builder.build();
      expect(result).toStrictEqual([mockCaveat]);
    });

    it('should allow empty caveats when configured', () => {
      const builder = new CaveatBuilder(mockEnvironment, {
        allowEmptyCaveats: true,
      });
      const result = builder.build();
      expect(result).toStrictEqual([]);
    });
  });

  describe('extend', () => {
    it('should extend the builder with a new enforcer function', () => {
      const builder = new CaveatBuilder(mockEnvironment);
      const extendedBuilder = builder.extend('testEnforcer', () => mockCaveat);
      expect(extendedBuilder).toBeInstanceOf(CaveatBuilder);
      expect(extendedBuilder).not.toBe(builder);
    });

    it('should preserve existing caveats when extending', () => {
      const builder = new CaveatBuilder(mockEnvironment, {}, {}, [mockCaveat]);
      const extendedBuilder = builder.extend('testEnforcer', () => mockCaveat);
      const result = extendedBuilder.build();
      expect(result).toStrictEqual([mockCaveat]);
    });
  });

  describe('addCaveat', () => {
    it('should add a caveat directly', () => {
      const builder = new CaveatBuilder(mockEnvironment);
      const result = builder.addCaveat(mockCaveat).build();
      expect(result).toStrictEqual([mockCaveat]);
    });

    it('should add a caveat with default args', () => {
      const builder = new CaveatBuilder(mockEnvironment);
      const caveatWithoutArgs = {
        enforcer: mockCaveat.enforcer,
        terms: mockCaveat.terms,
      };
      const result = builder.addCaveat(caveatWithoutArgs).build();
      expect(result).toStrictEqual([mockCaveat]);
    });

    it('should add multiple caveats', () => {
      const builder = new CaveatBuilder(mockEnvironment);
      const secondCaveat = createCaveat(
        mockEnvironment.caveatEnforcers.AllowedTargetsEnforcer,
        toHex('0x87654321'),
      );
      const result = builder
        .addCaveat(mockCaveat)
        .addCaveat(secondCaveat)
        .build();
      expect(result).toStrictEqual([mockCaveat, secondCaveat]);
    });

    it('should throw error when using non-existent enforcer function', () => {
      const builder = new CaveatBuilder(mockEnvironment);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => builder.addCaveat('nonExistentEnforcer' as any)).toThrow(
        'Function "nonExistentEnforcer" does not exist.',
      );
    });
  });

  describe('build', () => {
    it('should return the built caveats', () => {
      const builder = new CaveatBuilder(mockEnvironment);
      const result = builder.addCaveat(mockCaveat).build();
      expect(result).toStrictEqual([mockCaveat]);
    });

    it('should throw error when building twice', () => {
      const builder = new CaveatBuilder(mockEnvironment);
      builder.addCaveat(mockCaveat).build();
      expect(() => builder.build()).toThrow(
        'This CaveatBuilder has already been built.',
      );
    });

    it('should throw error when no caveats are added and empty caveats are not allowed', () => {
      const builder = new CaveatBuilder(mockEnvironment);
      expect(() => builder.build()).toThrow(
        'No caveats found. If you definitely want to create an empty caveat collection, set `allowEmptyCaveats`.',
      );
    });

    it('should allow empty caveats when configured', () => {
      const builder = new CaveatBuilder(mockEnvironment, {
        allowEmptyCaveats: true,
      });
      const result = builder.build();
      expect(result).toStrictEqual([]);
    });
  });

  describe('with enforcer functions', () => {
    it('should add a caveat using an enforcer function', () => {
      const builder = new CaveatBuilder(mockEnvironment).extend(
        'testEnforcer',
        () => mockCaveat,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = builder.addCaveat('testEnforcer' as any).build();
      expect(result).toStrictEqual([mockCaveat]);
    });

    it('should add a caveat using an enforcer function with arguments', () => {
      const builder = new CaveatBuilder(mockEnvironment).extend(
        'testEnforcer',
        (env, arg1, arg2) => {
          expect(env).toBe(mockEnvironment);
          expect(arg1).toBe('arg1');
          expect(arg2).toBe('arg2');
          return mockCaveat;
        },
      );
      const result = builder.addCaveat('testEnforcer', 'arg1', 'arg2').build();
      expect(result).toStrictEqual([mockCaveat]);
    });
  });
});
