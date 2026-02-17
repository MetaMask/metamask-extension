import type { Hex } from '@metamask/utils';
import type { CaveatConfig } from '../../types/agent-account';
import type { DeleGatorEnvironment } from '../delegation';
import {
  parseLLMResponseToCaveats,
  validateCaveatConfig,
  getCaveatTypeDescription,
  CaveatParserError,
} from './caveat-parser';

// Mock DeleGator environment with test addresses
const mockEnvironment: DeleGatorEnvironment = {
  DelegationManager: '0x1000000000000000000000000000000000000001' as Hex,
  EIP7702StatelessDeleGatorImpl:
    '0x1000000000000000000000000000000000000002' as Hex,
  EntryPoint: '0x1000000000000000000000000000000000000003' as Hex,
  SimpleFactory: '0x1000000000000000000000000000000000000004' as Hex,
  implementations: {},
  caveatEnforcers: {
    AllowedMethodsEnforcer:
      '0x2000000000000000000000000000000000000001' as Hex,
    AllowedTargetsEnforcer:
      '0x2000000000000000000000000000000000000002' as Hex,
    ERC20BalanceChangeEnforcer:
      '0x2000000000000000000000000000000000000003' as Hex,
    NativeBalanceChangeEnforcer:
      '0x2000000000000000000000000000000000000004' as Hex,
    LimitedCallsEnforcer: '0x2000000000000000000000000000000000000005' as Hex,
    RedeemerEnforcer: '0x2000000000000000000000000000000000000006' as Hex,
  },
};

const mockAddress = '0x1234567890123456789012345678901234567890' as Hex;
const mockTokenAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Hex;
const zeroAddress = '0x0000000000000000000000000000000000000000' as Hex;

describe('caveat-parser', () => {
  describe('validateCaveatConfig', () => {
    it('should validate a valid allowedMethods config', () => {
      const config: CaveatConfig = {
        type: 'allowedMethods',
        params: {
          selectors: ['transfer(address,uint256)'],
        },
      };

      expect(validateCaveatConfig(config)).toBe(true);
    });

    it('should validate a valid allowedTargets config', () => {
      const config: CaveatConfig = {
        type: 'allowedTargets',
        params: {
          targets: [mockAddress],
        },
      };

      expect(validateCaveatConfig(config)).toBe(true);
    });

    it('should throw for null config', () => {
      expect(() => validateCaveatConfig(null as unknown as CaveatConfig)).toThrow(
        CaveatParserError,
      );
    });

    it('should throw for missing type', () => {
      const config = {
        params: { targets: [mockAddress] },
      } as unknown as CaveatConfig;

      expect(() => validateCaveatConfig(config)).toThrow(
        'Caveat config must have a string "type" field',
      );
    });

    it('should throw for unknown caveat type', () => {
      const config = {
        type: 'unknownType',
        params: {},
      } as unknown as CaveatConfig;

      expect(() => validateCaveatConfig(config)).toThrow(
        'Unknown caveat type: unknownType',
      );
    });

    it('should throw for missing params', () => {
      const config = {
        type: 'allowedMethods',
      } as unknown as CaveatConfig;

      expect(() => validateCaveatConfig(config)).toThrow(
        'Caveat config must have an object "params" field',
      );
    });
  });

  describe('parseLLMResponseToCaveats', () => {
    it('should return empty array for empty configs', () => {
      const result = parseLLMResponseToCaveats([], mockEnvironment);
      expect(result).toEqual([]);
    });

    it('should parse allowedMethods caveat', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'allowedMethods',
          params: {
            selectors: ['transfer(address,uint256)', '0x12345678'],
          },
        },
      ];

      const result = parseLLMResponseToCaveats(configs, mockEnvironment);

      expect(result).toHaveLength(1);
      expect(result[0].enforcer).toBe(
        mockEnvironment.caveatEnforcers.AllowedMethodsEnforcer,
      );
      expect(result[0].args).toBe('0x');
    });

    it('should parse allowedTargets caveat', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'allowedTargets',
          params: {
            targets: [mockAddress, mockTokenAddress],
          },
        },
      ];

      const result = parseLLMResponseToCaveats(configs, mockEnvironment);

      expect(result).toHaveLength(1);
      expect(result[0].enforcer).toBe(
        mockEnvironment.caveatEnforcers.AllowedTargetsEnforcer,
      );
    });

    it('should parse erc20BalanceChange caveat', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'erc20BalanceChange',
          params: {
            enforceDecrease: true,
            token: mockTokenAddress,
            recipient: zeroAddress,
            amount: '100000000',
          },
        },
      ];

      const result = parseLLMResponseToCaveats(configs, mockEnvironment);

      expect(result).toHaveLength(1);
      expect(result[0].enforcer).toBe(
        mockEnvironment.caveatEnforcers.ERC20BalanceChangeEnforcer,
      );
    });

    it('should parse nativeBalanceChange caveat', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'nativeBalanceChange',
          params: {
            enforceDecrease: true,
            recipient: mockAddress,
            amount: '1000000000000000000',
          },
        },
      ];

      const result = parseLLMResponseToCaveats(configs, mockEnvironment);

      expect(result).toHaveLength(1);
      expect(result[0].enforcer).toBe(
        mockEnvironment.caveatEnforcers.NativeBalanceChangeEnforcer,
      );
    });

    it('should parse limitedCalls caveat', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'limitedCalls',
          params: {
            count: 10,
          },
        },
      ];

      const result = parseLLMResponseToCaveats(configs, mockEnvironment);

      expect(result).toHaveLength(1);
      expect(result[0].enforcer).toBe(
        mockEnvironment.caveatEnforcers.LimitedCallsEnforcer,
      );
    });

    it('should parse redeemer caveat', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'redeemer',
          params: {
            redeemers: [mockAddress],
          },
        },
      ];

      const result = parseLLMResponseToCaveats(configs, mockEnvironment);

      expect(result).toHaveLength(1);
      expect(result[0].enforcer).toBe(
        mockEnvironment.caveatEnforcers.RedeemerEnforcer,
      );
    });

    it('should parse multiple caveats', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'allowedTargets',
          params: {
            targets: [mockTokenAddress],
          },
        },
        {
          type: 'erc20BalanceChange',
          params: {
            enforceDecrease: true,
            token: mockTokenAddress,
            recipient: zeroAddress,
            amount: '100000000',
          },
        },
        {
          type: 'limitedCalls',
          params: {
            count: 5,
          },
        },
      ];

      const result = parseLLMResponseToCaveats(configs, mockEnvironment);

      expect(result).toHaveLength(3);
    });

    it('should throw for invalid address in allowedTargets', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'allowedTargets',
          params: {
            targets: ['not-an-address'],
          },
        },
      ];

      expect(() => parseLLMResponseToCaveats(configs, mockEnvironment)).toThrow(
        CaveatParserError,
      );
    });

    it('should throw for empty selectors array', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'allowedMethods',
          params: {
            selectors: [],
          },
        },
      ];

      expect(() => parseLLMResponseToCaveats(configs, mockEnvironment)).toThrow(
        'selectors must be a non-empty array',
      );
    });

    it('should throw for invalid amount in erc20BalanceChange', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'erc20BalanceChange',
          params: {
            enforceDecrease: true,
            token: mockTokenAddress,
            recipient: zeroAddress,
            amount: 'not-a-number',
          },
        },
      ];

      expect(() => parseLLMResponseToCaveats(configs, mockEnvironment)).toThrow(
        CaveatParserError,
      );
    });

    it('should throw for non-boolean enforceDecrease', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'erc20BalanceChange',
          params: {
            enforceDecrease: 'true',
            token: mockTokenAddress,
            recipient: zeroAddress,
            amount: '100',
          },
        },
      ];

      expect(() => parseLLMResponseToCaveats(configs, mockEnvironment)).toThrow(
        'enforceDecrease must be a boolean',
      );
    });

    it('should throw for non-positive count in limitedCalls', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'limitedCalls',
          params: {
            count: 0,
          },
        },
      ];

      expect(() => parseLLMResponseToCaveats(configs, mockEnvironment)).toThrow(
        'count must be a positive integer',
      );
    });

    it('should accept numeric amount', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'nativeBalanceChange',
          params: {
            enforceDecrease: true,
            recipient: mockAddress,
            amount: 1000000,
          },
        },
      ];

      const result = parseLLMResponseToCaveats(configs, mockEnvironment);
      expect(result).toHaveLength(1);
    });

    it('should throw for unsupported caveat type', () => {
      const configs: CaveatConfig[] = [
        {
          type: 'timestamp',
          params: {},
        },
      ];

      expect(() => parseLLMResponseToCaveats(configs, mockEnvironment)).toThrow(
        'timestamp caveat is not yet supported by the parser',
      );
    });
  });

  describe('getCaveatTypeDescription', () => {
    it('should return description for allowedMethods', () => {
      expect(getCaveatTypeDescription('allowedMethods')).toBe(
        'Restricts which contract methods can be called',
      );
    });

    it('should return description for allowedTargets', () => {
      expect(getCaveatTypeDescription('allowedTargets')).toBe(
        'Restricts which contract addresses can be interacted with',
      );
    });

    it('should return description for erc20BalanceChange', () => {
      expect(getCaveatTypeDescription('erc20BalanceChange')).toBe(
        'Limits ERC20 token transfers',
      );
    });

    it('should return description for nativeBalanceChange', () => {
      expect(getCaveatTypeDescription('nativeBalanceChange')).toBe(
        'Limits native token (ETH) transfers',
      );
    });

    it('should return description for limitedCalls', () => {
      expect(getCaveatTypeDescription('limitedCalls')).toBe(
        'Limits the total number of times this delegation can be used',
      );
    });

    it('should return description for redeemer', () => {
      expect(getCaveatTypeDescription('redeemer')).toBe(
        'Restricts who can use this delegation',
      );
    });
  });

  describe('CaveatParserError', () => {
    it('should create error with all properties', () => {
      const error = new CaveatParserError('Test error', 'allowedMethods', {
        key: 'value',
      });

      expect(error.message).toBe('Test error');
      expect(error.caveatType).toBe('allowedMethods');
      expect(error.details).toEqual({ key: 'value' });
      expect(error.name).toBe('CaveatParserError');
    });

    it('should create error with just message', () => {
      const error = new CaveatParserError('Simple error');

      expect(error.message).toBe('Simple error');
      expect(error.caveatType).toBeUndefined();
      expect(error.details).toBeUndefined();
    });
  });
});
