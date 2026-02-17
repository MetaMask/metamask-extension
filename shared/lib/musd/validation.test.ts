import type {
  WildcardTokenList,
  ConvertibleToken,
} from '../../../ui/pages/musd-conversion/types';
import { CHAIN_IDS } from '../../constants/network';
import {
  validateConversionAmount,
  isValidAmountInput,
  isAmountExceedsBalance,
  isAmountBelowMinimum,
  isConvertibleToken,
  isWildcardMatch,
  filterConvertibleTokens,
  isGeoBlocked,
  canUserAccessMusdConversion,
  ValidationResult,
} from './validation';

describe('MUSD Validation Utilities', () => {
  describe('validateConversionAmount', () => {
    it('should return valid for a valid amount within balance', () => {
      const result = validateConversionAmount({
        amount: '100',
        balance: '200000000', // 200 tokens in wei (6 decimals)
        tokenDecimals: 6,
        minAmountUsd: 0.01,
        fiatBalance: 200,
      });

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for amount exceeding balance', () => {
      const result = validateConversionAmount({
        amount: '300',
        balance: '200000000', // 200 tokens
        tokenDecimals: 6,
        minAmountUsd: 0.01,
        fiatBalance: 200,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('insufficient_balance');
    });

    it('should return invalid for amount below minimum', () => {
      const result = validateConversionAmount({
        amount: '0.001',
        balance: '200000000',
        tokenDecimals: 6,
        minAmountUsd: 0.01,
        fiatBalance: 200,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('below_minimum');
    });

    it('should return invalid for zero amount', () => {
      const result = validateConversionAmount({
        amount: '0',
        balance: '200000000',
        tokenDecimals: 6,
        minAmountUsd: 0.01,
        fiatBalance: 200,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_amount');
    });

    it('should return invalid for negative amount', () => {
      const result = validateConversionAmount({
        amount: '-100',
        balance: '200000000',
        tokenDecimals: 6,
        minAmountUsd: 0.01,
        fiatBalance: 200,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_amount');
    });

    it('should return invalid for non-numeric amount', () => {
      const result = validateConversionAmount({
        amount: 'abc',
        balance: '200000000',
        tokenDecimals: 6,
        minAmountUsd: 0.01,
        fiatBalance: 200,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_amount');
    });

    it('should return invalid for empty amount', () => {
      const result = validateConversionAmount({
        amount: '',
        balance: '200000000',
        tokenDecimals: 6,
        minAmountUsd: 0.01,
        fiatBalance: 200,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('invalid_amount');
    });
  });

  describe('isValidAmountInput', () => {
    it('should return true for valid positive number', () => {
      expect(isValidAmountInput('100')).toBe(true);
      expect(isValidAmountInput('0.01')).toBe(true);
      expect(isValidAmountInput('1000.50')).toBe(true);
    });

    it('should return false for zero', () => {
      expect(isValidAmountInput('0')).toBe(false);
      expect(isValidAmountInput('0.00')).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isValidAmountInput('-100')).toBe(false);
    });

    it('should return false for non-numeric strings', () => {
      expect(isValidAmountInput('abc')).toBe(false);
      expect(isValidAmountInput('')).toBe(false);
      expect(isValidAmountInput('12.34.56')).toBe(false);
    });
  });

  describe('isAmountExceedsBalance', () => {
    it('should return false when amount is less than balance', () => {
      expect(isAmountExceedsBalance('50', '100000000', 6)).toBe(false);
    });

    it('should return false when amount equals balance', () => {
      expect(isAmountExceedsBalance('100', '100000000', 6)).toBe(false);
    });

    it('should return true when amount exceeds balance', () => {
      expect(isAmountExceedsBalance('150', '100000000', 6)).toBe(true);
    });
  });

  describe('isAmountBelowMinimum', () => {
    it('should return false when amount is above minimum', () => {
      expect(isAmountBelowMinimum('1', 0.01)).toBe(false);
    });

    it('should return false when amount equals minimum', () => {
      expect(isAmountBelowMinimum('0.01', 0.01)).toBe(false);
    });

    it('should return true when amount is below minimum', () => {
      expect(isAmountBelowMinimum('0.001', 0.01)).toBe(true);
    });
  });

  describe('isWildcardMatch', () => {
    it('should match wildcard "*" for any value', () => {
      expect(isWildcardMatch('*', 'USDC')).toBe(true);
      expect(isWildcardMatch('*', 'ETH')).toBe(true);
    });

    it('should match exact values', () => {
      expect(isWildcardMatch('USDC', 'USDC')).toBe(true);
      expect(isWildcardMatch('USDC', 'USDT')).toBe(false);
    });

    it('should be case-insensitive', () => {
      expect(isWildcardMatch('usdc', 'USDC')).toBe(true);
      expect(isWildcardMatch('USDC', 'usdc')).toBe(true);
    });
  });

  describe('isConvertibleToken', () => {
    const allowlist: WildcardTokenList = {
      '*': ['USDC', 'USDT'],
      '0x1': ['DAI'],
    };

    const blocklist: WildcardTokenList = {
      '0x38': ['USDT'], // Block USDT on BSC
    };

    it('should return true for allowed token on any chain', () => {
      expect(
        isConvertibleToken({
          symbol: 'USDC',
          chainId: '0x1',
          allowlist,
          blocklist: {},
        }),
      ).toBe(true);
    });

    it('should return true for chain-specific allowed token', () => {
      expect(
        isConvertibleToken({
          symbol: 'DAI',
          chainId: '0x1',
          allowlist,
          blocklist: {},
        }),
      ).toBe(true);
    });

    it('should return false for non-allowed token', () => {
      expect(
        isConvertibleToken({
          symbol: 'WETH',
          chainId: '0x1',
          allowlist,
          blocklist: {},
        }),
      ).toBe(false);
    });

    it('should return false for blocklisted token', () => {
      expect(
        isConvertibleToken({
          symbol: 'USDT',
          chainId: '0x38',
          allowlist: { '*': ['*'] }, // Allow all
          blocklist,
        }),
      ).toBe(false);
    });
  });

  describe('filterConvertibleTokens', () => {
    const mockTokens: ConvertibleToken[] = [
      {
        address: '0x1',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        chainId: '0x1',
        balance: '100000000',
        fiatBalance: '100',
      },
      {
        address: '0x2',
        symbol: 'USDT',
        name: 'Tether',
        decimals: 6,
        chainId: '0x1',
        balance: '50000000',
        fiatBalance: '50',
      },
      {
        address: '0x3',
        symbol: 'DAI',
        name: 'Dai',
        decimals: 18,
        chainId: '0x1',
        balance: '10000000000000000000',
        fiatBalance: '10',
      },
    ];

    it('should filter tokens based on allowlist', () => {
      const result = filterConvertibleTokens({
        tokens: mockTokens,
        allowlist: { '*': ['USDC'] },
        blocklist: {},
        minBalanceUsd: 0,
      });

      expect(result).toHaveLength(1);
      expect(result[0].symbol).toBe('USDC');
    });

    it('should filter out tokens below minimum balance', () => {
      const result = filterConvertibleTokens({
        tokens: mockTokens,
        allowlist: { '*': ['*'] },
        blocklist: {},
        minBalanceUsd: 20,
      });

      expect(result).toHaveLength(2);
      expect(result.find((t) => t.symbol === 'DAI')).toBeUndefined();
    });

    it('should filter out blocklisted tokens', () => {
      const result = filterConvertibleTokens({
        tokens: mockTokens,
        allowlist: { '*': ['*'] },
        blocklist: { '0x1': ['USDT'] },
        minBalanceUsd: 0,
      });

      expect(result).toHaveLength(2);
      expect(result.find((t) => t.symbol === 'USDT')).toBeUndefined();
    });
  });

  describe('isGeoBlocked', () => {
    const blockedRegions = ['GB', 'GB-ENG', 'US-NY'];

    it('should return true for blocked country', () => {
      expect(isGeoBlocked('GB', blockedRegions)).toBe(true);
    });

    it('should return true for blocked region', () => {
      expect(isGeoBlocked('GB-ENG', blockedRegions)).toBe(true);
    });

    it('should return true for blocked US state', () => {
      expect(isGeoBlocked('US-NY', blockedRegions)).toBe(true);
    });

    it('should return false for non-blocked country', () => {
      expect(isGeoBlocked('US', blockedRegions)).toBe(false);
      expect(isGeoBlocked('DE', blockedRegions)).toBe(false);
    });

    it('should return false for non-blocked US state', () => {
      expect(isGeoBlocked('US-CA', blockedRegions)).toBe(false);
    });

    it('should use startsWith matching for country-region codes', () => {
      // GB should match GB-ENG, GB-SCT, etc.
      expect(isGeoBlocked('GB-SCT', ['GB'])).toBe(true);
      // But US should not match if only US-NY is blocked
      expect(isGeoBlocked('US', ['US-NY'])).toBe(false);
    });

    it('should return true (block by default) for unknown/empty country', () => {
      expect(isGeoBlocked('', blockedRegions)).toBe(true);
      expect(isGeoBlocked(undefined as unknown as string, blockedRegions)).toBe(
        true,
      );
    });
  });

  describe('canUserAccessMusdConversion', () => {
    it('should return true when all conditions are met', () => {
      const result = canUserAccessMusdConversion({
        isFeatureEnabled: true,
        isGeoBlocked: false,
        hasConvertibleTokens: true,
      });

      expect(result.canAccess).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return false when feature is disabled', () => {
      const result = canUserAccessMusdConversion({
        isFeatureEnabled: false,
        isGeoBlocked: false,
        hasConvertibleTokens: true,
      });

      expect(result.canAccess).toBe(false);
      expect(result.reason).toBe('feature_disabled');
    });

    it('should return false when user is geo-blocked', () => {
      const result = canUserAccessMusdConversion({
        isFeatureEnabled: true,
        isGeoBlocked: true,
        hasConvertibleTokens: true,
      });

      expect(result.canAccess).toBe(false);
      expect(result.reason).toBe('geo_blocked');
    });

    it('should return false when user has no convertible tokens', () => {
      const result = canUserAccessMusdConversion({
        isFeatureEnabled: true,
        isGeoBlocked: false,
        hasConvertibleTokens: false,
      });

      expect(result.canAccess).toBe(false);
      expect(result.reason).toBe('no_convertible_tokens');
    });

    it('should prioritize geo_blocked over no_convertible_tokens', () => {
      const result = canUserAccessMusdConversion({
        isFeatureEnabled: true,
        isGeoBlocked: true,
        hasConvertibleTokens: false,
      });

      expect(result.reason).toBe('geo_blocked');
    });
  });
});
