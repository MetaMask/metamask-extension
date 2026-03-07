/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react-hooks';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import type { Hex } from '@metamask/utils';
import type { TokenWithFiatAmount } from '../../components/app/assets/types';
import type { Asset } from '../../pages/confirmations/types/send';
import {
  useMusdCtaVisibility,
  BuyGetMusdCtaVariant,
} from './useMusdCtaVisibility';
import { useMusdGeoBlocking } from './useMusdGeoBlocking';
import type { UseMusdGeoBlockingResult } from './useMusdGeoBlocking';
import { useMusdConversionTokens } from './useMusdConversionTokens';
import type { ConversionToken } from './useMusdConversionTokens';

// Mock the geo-blocking hook
jest.mock('./useMusdGeoBlocking', () => ({
  useMusdGeoBlocking: jest.fn(() => ({
    isBlocked: false,
    userCountry: 'US',
    isLoading: false,
  })),
}));

// Mock the conversion hook
jest.mock('./useMusdConversion', () => ({
  useMusdConversion: jest.fn(() => ({
    educationSeen: false,
    startConversionFlow: jest.fn(),
  })),
}));

// Mock the conversion tokens hook
jest.mock('./useMusdConversionTokens', () => ({
  useMusdConversionTokens: jest.fn(() => ({
    tokens: [],
    isConversionToken: jest.fn(() => false),
    isMusdSupportedOnChain: jest.fn(() => true),
    hasConvertibleTokensByChainId: jest.fn(() => false),
    filterAllowedTokens: jest.fn(() => []),
  })),
}));

/** Partial metamask slice used by createMockStore overrides */
type MockMetamaskOverrides = {
  remoteFeatureFlags?: {
    earnMusdConversionFlowEnabled?: boolean;
    earnMusdCtaEnabled?: boolean;
    earnMusdConversionTokenListItemCtaEnabled?: boolean;
    earnMusdConversionAssetOverviewCtaEnabled?: boolean;
    earnMusdConversionCtaTokens?: Record<string, string[]>;
  };
  selectedNetworkClientId?: string;
  networkConfigurationsByChainId?: Record<
    string,
    { chainId: string; name: string }
  >;
  internalAccounts?: {
    selectedAccount?: string;
    accounts?: Record<string, { id: string; address: string }>;
  };
  balances?: Record<string, unknown>;
  musdConversionEducationSeen?: boolean;
  musdConversionDismissedCtaKeys?: string[];
};

type CreateMockStoreOverrides = {
  metamask?: MockMetamaskOverrides;
};

const createGeoBlockingMock = (
  overrides: Partial<
    Pick<UseMusdGeoBlockingResult, 'isBlocked' | 'userCountry'>
  >,
): UseMusdGeoBlockingResult => ({
  isBlocked: false,
  userCountry: 'US',
  isLoading: false,
  error: null,
  blockedRegions: [],
  blockedMessage: null,
  refreshGeolocation: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

const createMockConversionToken = (
  overrides: Partial<
    Pick<TokenWithFiatAmount, 'address' | 'chainId' | 'symbol'>
  > = {},
): TokenWithFiatAmount =>
  ({
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    chainId: '0x1',
    symbol: 'USDC',
    image: '',
    decimals: 6,
    secondary: null,
    title: 'USDC',
    ...overrides,
  }) as TokenWithFiatAmount;

const createMockStore = (overrides: CreateMockStoreOverrides = {}) => {
  const defaultState = {
    metamask: {
      remoteFeatureFlags: {
        earnMusdConversionFlowEnabled: true,
        earnMusdCtaEnabled: true,
        earnMusdConversionTokenListItemCtaEnabled: true,
        earnMusdConversionAssetOverviewCtaEnabled: true,
        earnMusdConversionCtaTokens: {
          '*': ['USDC', 'USDT', 'DAI'],
        },
      },
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {
        '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
        '0xe708': { chainId: '0xe708', name: 'Linea Mainnet' },
      },
      internalAccounts: {
        selectedAccount: 'account-1',
        accounts: {
          'account-1': {
            id: 'account-1',
            address: '0x123',
          },
        },
      },
      balances: {},
      musdConversionEducationSeen: false,
      musdConversionDismissedCtaKeys: [],
    },
  };
  const mergedState = {
    ...defaultState,
    ...overrides,
    metamask: { ...defaultState.metamask, ...overrides.metamask },
  };

  return configureStore({
    reducer: {
      metamask: (state = mergedState.metamask) => state,
    },
    preloadedState: mergedState,
  });
};

const wrapper = ({
  children,
  store,
}: {
  children: React.ReactNode;
  store: ReturnType<typeof createMockStore>;
}) => React.createElement(Provider, { store }, children);

describe('useMusdCtaVisibility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shouldShowBuyGetMusdCta', () => {
    it('returns shouldShowCta: false when feature flag is disabled', () => {
      const store = createMockStore({
        metamask: {
          remoteFeatureFlags: {
            earnMusdConversionFlowEnabled: false,
            earnMusdCtaEnabled: false,
          },
        },
      });

      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const ctaState = result.current.shouldShowBuyGetMusdCta();
      expect(ctaState.shouldShowCta).toBe(false);
    });

    it('returns shouldShowCta: false when user is geo-blocked', () => {
      jest
        .mocked(useMusdGeoBlocking)
        .mockReturnValue(
          createGeoBlockingMock({ isBlocked: true, userCountry: 'GB' }),
        );

      const store = createMockStore();
      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const ctaState = result.current.shouldShowBuyGetMusdCta();
      expect(ctaState.shouldShowCta).toBe(false);
    });

    it('returns GET variant when user has convertible tokens', () => {
      jest
        .mocked(useMusdGeoBlocking)
        .mockReturnValue(
          createGeoBlockingMock({ isBlocked: false, userCountry: 'US' }),
        );

      const store = createMockStore();
      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const ctaState = result.current.shouldShowBuyGetMusdCta({
        hasConvertibleTokens: true,
        hasMusdBalance: false,
        selectedChainId: '0x1' as Hex,
      });

      expect(ctaState.shouldShowCta).toBe(true);
      expect(ctaState.variant).toBe(BuyGetMusdCtaVariant.GET);
    });

    it('returns BUY variant when wallet is empty', () => {
      jest
        .mocked(useMusdGeoBlocking)
        .mockReturnValue(
          createGeoBlockingMock({ isBlocked: false, userCountry: 'US' }),
        );

      const store = createMockStore();
      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const ctaState = result.current.shouldShowBuyGetMusdCta({
        hasConvertibleTokens: false,
        hasMusdBalance: false,
        isEmptyWallet: true,
        selectedChainId: '0x1' as Hex,
      });

      expect(ctaState.shouldShowCta).toBe(true);
      expect(ctaState.variant).toBe(BuyGetMusdCtaVariant.BUY);
    });

    it('returns shouldShowCta: false when user already has mUSD balance', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const ctaState = result.current.shouldShowBuyGetMusdCta({
        hasConvertibleTokens: true,
        hasMusdBalance: true,
        selectedChainId: '0x1' as Hex,
      });

      expect(ctaState.shouldShowCta).toBe(false);
    });
  });

  describe('shouldShowTokenListItemCta', () => {
    it('returns false when feature flag is disabled', () => {
      const store = createMockStore({
        metamask: {
          remoteFeatureFlags: {
            earnMusdConversionFlowEnabled: true,
            earnMusdConversionTokenListItemCtaEnabled: false,
          },
        },
      });

      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const shouldShow = result.current.shouldShowTokenListItemCta({
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Hex,
        chainId: '0x1' as Hex,
        symbol: 'USDC',
      });

      expect(shouldShow).toBe(false);
    });

    it('returns false when user is geo-blocked', () => {
      jest
        .mocked(useMusdGeoBlocking)
        .mockReturnValue(
          createGeoBlockingMock({ isBlocked: true, userCountry: 'GB' }),
        );

      const store = createMockStore();
      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const shouldShow = result.current.shouldShowTokenListItemCta({
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Hex,
        chainId: '0x1' as Hex,
        symbol: 'USDC',
      });

      expect(shouldShow).toBe(false);
    });

    it('returns true for eligible tokens on supported chains when user has mUSD balance', () => {
      jest
        .mocked(useMusdGeoBlocking)
        .mockReturnValue(
          createGeoBlockingMock({ isBlocked: false, userCountry: 'US' }),
        );

      jest.mocked(useMusdConversionTokens).mockReturnValue({
        tokens: [createMockConversionToken()],
        isConversionToken: jest.fn(() => true),
        isMusdSupportedOnChain: jest.fn(() => true),
        hasConvertibleTokensByChainId: jest.fn(() => false),
        filterAllowedTokens: jest.fn(
          <TToken extends ConversionToken>(tokens: TToken[]) => tokens,
        ),
        filterTokens: jest.fn((assets: Asset[]) => assets),
        defaultPaymentToken: null,
      });

      const store = createMockStore();
      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const shouldShow = result.current.shouldShowTokenListItemCta(
        {
          address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Hex,
          chainId: '0x1' as Hex,
          symbol: 'USDC',
        },
        { hasMusdBalance: true },
      );

      expect(shouldShow).toBe(true);
    });

    it('returns false for non-convertible tokens', () => {
      jest
        .mocked(useMusdGeoBlocking)
        .mockReturnValue(
          createGeoBlockingMock({ isBlocked: false, userCountry: 'US' }),
        );

      const store = createMockStore();
      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const shouldShow = result.current.shouldShowTokenListItemCta(
        {
          address: '0x1234567890123456789012345678901234567890' as Hex,
          chainId: '0x1' as Hex,
          symbol: 'RANDOM',
        },
        { hasMusdBalance: true },
      );

      expect(shouldShow).toBe(false);
    });
  });

  describe('shouldShowAssetOverviewCta', () => {
    it('returns false when feature flag is disabled', () => {
      const store = createMockStore({
        metamask: {
          remoteFeatureFlags: {
            earnMusdConversionFlowEnabled: true,
            earnMusdConversionAssetOverviewCtaEnabled: false,
          },
        },
      });

      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const shouldShow = result.current.shouldShowAssetOverviewCta({
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Hex,
        chainId: '0x1' as Hex,
        symbol: 'USDC',
      });

      expect(shouldShow).toBe(false);
    });

    it('returns false when CTA has been dismissed for this token', () => {
      const store = createMockStore({
        metamask: {
          musdConversionDismissedCtaKeys: [
            '0x1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          ],
        },
      });

      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const shouldShow = result.current.shouldShowAssetOverviewCta({
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Hex,
        chainId: '0x1' as Hex,
        symbol: 'USDC',
      });

      expect(shouldShow).toBe(false);
    });

    it('returns true for eligible tokens that have not been dismissed', () => {
      jest
        .mocked(useMusdGeoBlocking)
        .mockReturnValue(
          createGeoBlockingMock({ isBlocked: false, userCountry: 'US' }),
        );

      jest.mocked(useMusdConversionTokens).mockReturnValue({
        tokens: [createMockConversionToken()],
        isConversionToken: jest.fn(() => true),
        isMusdSupportedOnChain: jest.fn(() => true),
        hasConvertibleTokensByChainId: jest.fn(() => false),
        filterAllowedTokens: jest.fn(
          <TToken extends ConversionToken>(tokens: TToken[]) => tokens,
        ),
        filterTokens: jest.fn((assets: Asset[]) => assets),
        defaultPaymentToken: null,
      });

      const store = createMockStore();
      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const shouldShow = result.current.shouldShowAssetOverviewCta({
        address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as Hex,
        chainId: '0x1' as Hex,
        symbol: 'USDC',
      });

      expect(shouldShow).toBe(true);
    });
  });

  describe('isTokenWithCta', () => {
    it('returns true for tokens in the CTA allowlist', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.isTokenWithCta('USDC', '0x1' as Hex)).toBe(true);
      expect(result.current.isTokenWithCta('USDT', '0x1' as Hex)).toBe(true);
      expect(result.current.isTokenWithCta('DAI', '0x1' as Hex)).toBe(true);
    });

    it('returns false for tokens not in the CTA allowlist', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      expect(result.current.isTokenWithCta('WETH', '0x1' as Hex)).toBe(false);
      expect(result.current.isTokenWithCta('LINK', '0x1' as Hex)).toBe(false);
    });
  });

  describe('getCtaKey', () => {
    it('generates correct CTA key from chainId and address', () => {
      const store = createMockStore();
      const { result } = renderHook(() => useMusdCtaVisibility(), {
        wrapper: ({ children }) => wrapper({ children, store }),
      });

      const key = result.current.getCtaKey(
        '0x1' as Hex,
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as Hex,
      );

      expect(key).toBe('0x1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');
    });
  });
});
