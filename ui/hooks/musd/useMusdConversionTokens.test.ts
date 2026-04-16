import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import type { Hex } from '@metamask/utils';
import type { TokenWithFiatAmount } from '../../components/app/assets/types';

// Import mocked modules
import {
  selectMusdConvertibleTokensAllowlist,
  selectMusdConvertibleTokensBlocklist,
  selectMusdMinAssetBalanceRequired,
} from '../../selectors/musd';
import { getAssetsBySelectedAccountGroup } from '../../selectors/assets';
import { useMusdConversionTokens } from './useMusdConversionTokens';
import { useMusdNetworkFilter } from './useMusdNetworkFilter';

// Mock hooks
jest.mock('./useMusdNetworkFilter', () => ({
  useMusdNetworkFilter: jest.fn(),
}));

const mockUseMusdNetworkFilter = useMusdNetworkFilter as jest.Mock;

// Mock selectors
jest.mock('../../selectors/musd', () => ({
  selectMusdConvertibleTokensAllowlist: jest.fn(),
  selectMusdConvertibleTokensBlocklist: jest.fn(),
  selectMusdMinAssetBalanceRequired: jest.fn(),
}));

jest.mock('../../selectors/assets', () => ({
  getAssetsBySelectedAccountGroup: jest.fn(),
}));

const mockSelectMusdConvertibleTokensAllowlist = jest.mocked(
  selectMusdConvertibleTokensAllowlist,
);
const mockSelectMusdConvertibleTokensBlocklist = jest.mocked(
  selectMusdConvertibleTokensBlocklist,
);
const mockSelectMusdMinAssetBalanceRequired = jest.mocked(
  selectMusdMinAssetBalanceRequired,
);
const mockGetAssetsBySelectedAccountGroup = jest.mocked(
  getAssetsBySelectedAccountGroup,
);

// Test data
const mockUsdcMainnet: TokenWithFiatAmount = {
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Hex,
  chainId: '0x1' as Hex,
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  balance: '1000000',
  tokenFiatAmount: 100,
  secondary: null,
  title: 'USD Coin',
  image: 'https://example.com/usdc.png',
};

const mockUsdtMainnet: TokenWithFiatAmount = {
  address: '0xdac17f958d2ee523a2206206994597c13d831ec7' as Hex,
  chainId: '0x1' as Hex,
  symbol: 'USDT',
  name: 'Tether USD',
  decimals: 6,
  balance: '2000000',
  tokenFiatAmount: 200,
  secondary: null,
  title: 'Tether USD',
  image: 'https://example.com/usdt.png',
};

const mockUsdcLinea: TokenWithFiatAmount = {
  address: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff' as Hex,
  chainId: '0xe708' as Hex,
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  balance: '500000',
  tokenFiatAmount: 50,
  secondary: null,
  title: 'USD Coin',
  image: 'https://example.com/usdc.png',
};

const mockDaiMainnet: TokenWithFiatAmount = {
  address: '0x6b175474e89094c44da98b954eedeac495271d0f' as Hex,
  chainId: '0x1' as Hex,
  symbol: 'DAI',
  name: 'Dai Stablecoin',
  decimals: 18,
  balance: '3000000',
  tokenFiatAmount: 300,
  secondary: null,
  title: 'Dai Stablecoin',
  image: 'https://example.com/dai.png',
};

/**
 * Converts a flat array of tokens into the account-group-assets structure
 * keyed by chainId, as returned by getAssetsBySelectedAccountGroup.
 *
 * @param tokens - Tokens to convert to account-group-assets.
 */
function toAccountGroupAssets(tokens: TokenWithFiatAmount[]) {
  const assets: Record<string, Record<string, unknown>[]> = {};
  for (const token of tokens) {
    const chainId = token.chainId as string;
    if (!assets[chainId]) {
      assets[chainId] = [];
    }
    assets[chainId].push({
      ...token,
      fiat: { balance: token.tokenFiatAmount ?? null },
    });
  }

  // Partial implementation.
  return assets as unknown as ReturnType<
    typeof getAssetsBySelectedAccountGroup
  >;
}

// Helper to create a wrapper with Redux store
const createWrapper = () => {
  const store = configureStore({
    reducer: {
      metamask: () => ({}),
    },
  });

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(Provider, { store }, children);

  return Wrapper;
};

describe('useMusdConversionTokens', () => {
  const mockAllowlist = {
    '0x1': ['USDC', 'USDT'],
    '0xe708': ['USDC'],
  };

  const mockBlocklist = {};

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseMusdNetworkFilter.mockReturnValue({
      isPopularNetworksFilterActive: true,
      selectedChainId: null,
      enabledChainIds: ['0x1', '0xe708'],
    });
    mockSelectMusdConvertibleTokensAllowlist.mockReturnValue(mockAllowlist);
    mockSelectMusdConvertibleTokensBlocklist.mockReturnValue(mockBlocklist);
    mockSelectMusdMinAssetBalanceRequired.mockReturnValue(0.01);
    mockGetAssetsBySelectedAccountGroup.mockReturnValue({});
  });

  describe('hook structure', () => {
    it('returns object with filterAllowedTokens, isConversionToken, isMusdSupportedOnChain, hasConvertibleTokensByChainId, and tokens properties', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toHaveProperty('filterAllowedTokens');
      expect(result.current).toHaveProperty('isConversionToken');
      expect(result.current).toHaveProperty('isMusdSupportedOnChain');
      expect(result.current).toHaveProperty('hasConvertibleTokensByChainId');
      expect(result.current).toHaveProperty('tokens');
    });

    it('returns filterAllowedTokens as a function', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.filterAllowedTokens).toBe('function');
    });

    it('returns isConversionToken as a function', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.isConversionToken).toBe('function');
    });

    it('returns isMusdSupportedOnChain as a function', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.isMusdSupportedOnChain).toBe('function');
    });

    it('returns tokens as an array', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(Array.isArray(result.current.tokens)).toBe(true);
    });
  });

  describe('token filtering', () => {
    it('filters tokens correctly based on allowlist', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([
          mockUsdcMainnet,
          mockUsdtMainnet,
          mockDaiMainnet,
        ]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.tokens).toHaveLength(2);
      expect(result.current.tokens.map((t) => t.symbol)).toContain('USDC');
      expect(result.current.tokens.map((t) => t.symbol)).toContain('USDT');
      expect(result.current.tokens.map((t) => t.symbol)).not.toContain('DAI');
    });

    it('returns empty array when no tokens match allowlist', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockDaiMainnet]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.tokens).toEqual([]);
    });

    it('filters tokens from multiple chains correctly', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet, mockUsdcLinea, mockDaiMainnet]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.tokens).toHaveLength(2);
      expect(
        result.current.tokens.some(
          (t) => t.symbol === 'USDC' && t.chainId === '0x1',
        ),
      ).toBe(true);
      expect(
        result.current.tokens.some(
          (t) => t.symbol === 'USDC' && t.chainId === '0xe708',
        ),
      ).toBe(true);
    });

    it('filters out token when fiat balance is below min threshold', () => {
      const usdcBelowMin: TokenWithFiatAmount = {
        ...mockUsdcMainnet,
        tokenFiatAmount: 0.009, // Below 0.01 threshold
      };

      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([usdcBelowMin]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.tokens).toEqual([]);
    });

    it('filters out token when fiat balance is below selector min threshold', () => {
      mockSelectMusdMinAssetBalanceRequired.mockReturnValue(0.05);

      const usdcBelowSelectorMin: TokenWithFiatAmount = {
        ...mockUsdcMainnet,
        tokenFiatAmount: 0.049, // Below 0.05 threshold
      };

      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([usdcBelowSelectorMin]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.tokens).toEqual([]);
    });

    it('includes token when fiat balance equals zero and minimum required balance is zero', () => {
      mockSelectMusdMinAssetBalanceRequired.mockReturnValue(0);

      const usdcFiatZero: TokenWithFiatAmount = {
        ...mockUsdcMainnet,
        balance: '1',
        tokenFiatAmount: 0,
      };

      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([usdcFiatZero]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.tokens).toHaveLength(1);
      expect(result.current.tokens[0].symbol).toBe('USDC');
    });

    it('filters out token when fiat balance is null', () => {
      const usdcNullFiat: TokenWithFiatAmount = {
        ...mockUsdcMainnet,
        tokenFiatAmount: null,
      };

      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([usdcNullFiat]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.tokens).toEqual([]);
    });

    it('filters out token when fiat balance is undefined', () => {
      const usdcUndefinedFiat: TokenWithFiatAmount = {
        ...mockUsdcMainnet,
        tokenFiatAmount: undefined,
      };

      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([usdcUndefinedFiat]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.tokens).toEqual([]);
    });
  });

  describe('isConversionToken', () => {
    it('returns true for token in conversion tokens list with matching address and chainId', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      const isConversion = result.current.isConversionToken(mockUsdcMainnet);
      expect(isConversion).toBe(true);
    });

    it('returns false for token not in conversion tokens list', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      const isConversion = result.current.isConversionToken(mockDaiMainnet);
      expect(isConversion).toBe(false);
    });

    it('returns false when token is undefined', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      const isConversion = result.current.isConversionToken(undefined);
      expect(isConversion).toBe(false);
    });

    it('returns false when token address matches but chainId differs', () => {
      const usdcWithDifferentChain = {
        ...mockUsdcMainnet,
        chainId: '0x89' as Hex, // Polygon
      };
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      const isConversion = result.current.isConversionToken(
        usdcWithDifferentChain,
      );
      expect(isConversion).toBe(false);
    });

    it('performs case-insensitive address comparison', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      const uppercaseUsdc = {
        ...mockUsdcMainnet,
        address: mockUsdcMainnet.address.toUpperCase() as Hex,
      };

      const isConversion = result.current.isConversionToken(uppercaseUsdc);
      expect(isConversion).toBe(true);
    });
  });

  describe('isMusdSupportedOnChain', () => {
    it('returns true for Ethereum mainnet', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isMusdSupportedOnChain('0x1')).toBe(true);
    });

    it('returns true for Linea mainnet', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isMusdSupportedOnChain('0xe708')).toBe(true);
    });

    it('returns true for supported chain when chain ID has uppercase hex digits', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isMusdSupportedOnChain('0xE708')).toBe(true);
      expect(result.current.isMusdSupportedOnChain('0x1')).toBe(true);
    });

    it('returns false for unsupported chain', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isMusdSupportedOnChain('0x89')).toBe(false);
    });

    it('returns false for empty string', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isMusdSupportedOnChain('')).toBe(false);
    });

    it('returns false for undefined', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isMusdSupportedOnChain(undefined)).toBe(false);
    });
  });

  describe('hasConvertibleTokensByChainId', () => {
    it('returns true when there are convertible tokens on the chain', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasConvertibleTokensByChainId('0x1' as Hex)).toBe(
        true,
      );
    });

    it('returns false when there are no convertible tokens on the chain', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasConvertibleTokensByChainId('0x89' as Hex)).toBe(
        false,
      );
    });

    it('returns false for tokens below min balance threshold', () => {
      const usdcBelowMin: TokenWithFiatAmount = {
        ...mockUsdcMainnet,
        tokenFiatAmount: 0.001,
      };
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([usdcBelowMin]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.hasConvertibleTokensByChainId('0x1' as Hex)).toBe(
        false,
      );
    });
  });

  describe('filterAllowedTokens callback', () => {
    it('filters array of tokens correctly', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      const filtered = result.current.filterAllowedTokens([
        mockUsdcMainnet,
        mockDaiMainnet,
      ]);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].symbol).toBe('USDC');
    });

    it('returns empty array when given empty array', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      const filtered = result.current.filterAllowedTokens([]);
      expect(filtered).toEqual([]);
    });

    it('filters by both allowlist and minimum balance', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      const usdcBelowMin: TokenWithFiatAmount = {
        ...mockUsdcMainnet,
        tokenFiatAmount: 0.001, // Below min
      };

      const filtered = result.current.filterAllowedTokens([
        usdcBelowMin, // Should be filtered out (below min)
        mockUsdtMainnet, // Should pass (in allowlist, above min)
        mockDaiMainnet, // Should be filtered out (not in allowlist)
      ]);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].symbol).toBe('USDT');
    });
  });

  describe('blocklist handling', () => {
    it('filters out tokens in blocklist even if in allowlist', () => {
      mockSelectMusdConvertibleTokensBlocklist.mockReturnValue({
        '0x1': ['USDT'],
      });

      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet, mockUsdtMainnet]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.tokens).toHaveLength(1);
      expect(result.current.tokens[0].symbol).toBe('USDC');
    });
  });

  describe('empty allowlist handling', () => {
    it('passes all tokens through when allowlist is empty (no restriction)', () => {
      mockSelectMusdConvertibleTokensAllowlist.mockReturnValue({});

      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.tokens).toHaveLength(1);
      expect(result.current.tokens[0].symbol).toBe('USDC');
    });
  });

  describe('defaultPaymentToken', () => {
    it('returns first conversion token when no specific chain is selected (popular networks)', () => {
      mockUseMusdNetworkFilter.mockReturnValue({
        isPopularNetworksFilterActive: true,
        selectedChainId: null,
        enabledChainIds: ['0x1', '0xe708'],
      });
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet, mockUsdcLinea]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.defaultPaymentToken).not.toBeNull();
      expect(result.current.defaultPaymentToken?.chainId).toBe('0x1');
    });

    it('returns matching token when a single chain is selected', () => {
      mockUseMusdNetworkFilter.mockReturnValue({
        isPopularNetworksFilterActive: false,
        selectedChainId: '0xe708',
        enabledChainIds: ['0xe708'],
      });
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet, mockUsdcLinea]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.defaultPaymentToken).not.toBeNull();
      expect(result.current.defaultPaymentToken?.chainId).toBe('0xe708');
    });

    it('returns null when no conversion tokens exist', () => {
      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.defaultPaymentToken).toBeNull();
    });

    it('returns null when selected chain has no matching token', () => {
      mockUseMusdNetworkFilter.mockReturnValue({
        isPopularNetworksFilterActive: false,
        selectedChainId: '0x89',
        enabledChainIds: ['0x89'],
      });
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.defaultPaymentToken).toBeNull();
    });

    it('checksums the token address', () => {
      mockGetAssetsBySelectedAccountGroup.mockReturnValue(
        toAccountGroupAssets([mockUsdcMainnet]),
      );

      const { result } = renderHook(() => useMusdConversionTokens(), {
        wrapper: createWrapper(),
      });

      expect(result.current.defaultPaymentToken?.address).toBe(
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      );
    });
  });
});
