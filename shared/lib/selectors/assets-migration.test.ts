import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import type { CaipAssetType, Hex } from '@metamask/utils';
import {
  ASSETS_UNIFY_STATE_FLAG,
  ASSETS_UNIFY_STATE_VERSION_1,
} from '../assets-unify-state/remote-feature-flag';
import {
  getAccountTrackerControllerAccountsByChainId,
  getTokensControllerAllTokens,
  getTokensControllerAllIgnoredTokens,
  getTokenBalancesControllerTokenBalances,
  getMultiChainAssetsControllerAccountsAssets,
  getMultiChainAssetsControllerAssetsMetadata,
  getMultiChainAssetsControllerAllIgnoredAssets,
  getMultiChainBalancesControllerBalances,
  getCurrencyRateControllerCurrentCurrency,
  getCurrencyRateControllerCurrencyRates,
  getTokenRatesControllerMarketData,
  getMultichainAssetsRatesControllerConversionRates,
  getRatesControllerRates,
  getRatesControllerFiatCurrency,
} from './assets-migration';

// Opt out of the global `isAssetsUnifyStateFeatureEnabled` mock (see test/jest/setup.js)
// so these selector tests exercise the real feature-flag gating logic.
jest.mock('../assets-unify-state/remote-feature-flag', () =>
  jest.requireActual('../assets-unify-state/remote-feature-flag'),
);

const mockAccountId = 'mock-account-id-1';
const mockAccountId2 = 'mock-account-id-2';

const mockAccountAddressLowercase: Hex =
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
const mockAccountAddressChecksummed = toChecksumHexAddress(
  mockAccountAddressLowercase,
) as Hex;

const nativeEthAssetId = 'eip155:1/slip44:60';
const erc20AssetAddressLowercase: Hex =
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const erc20AssetAddressChecksummed = toChecksumHexAddress(
  erc20AssetAddressLowercase,
) as Hex;
const erc20AssetId = `eip155:1/erc20:${erc20AssetAddressLowercase}`;
const solanaTokenAssetId =
  'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const nativePolygonAssetId = 'eip155:137/slip44:966';
const bitcoinNativeAssetId = 'bip122:000000000019d6689c085ae165831e93/slip44:0';
const mockAccountId3 = 'mock-account-id-3';
const mockAccountAddressLowercase2: Hex =
  '0x1234567890abcdef1234567890abcdef12345678';
const enabledFlags = {
  remoteFeatureFlags: {
    [ASSETS_UNIFY_STATE_FLAG]: {
      enabled: true,
      featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
    },
  },
};

function makeMockPrice(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    assetPriceType: 'fungible',
    id: 'mock-price',
    price: 1,
    lastUpdated: 1700000000000,
    marketCap: 0,
    allTimeHigh: 0,
    allTimeLow: 0,
    totalVolume: 0,
    high1d: 0,
    low1d: 0,
    circulatingSupply: 0,
    dilutedMarketCap: 0,
    marketCapPercentChange1d: 0,
    priceChange1d: 0,
    pricePercentChange1h: 0,
    pricePercentChange1d: 0,
    pricePercentChange7d: 0,
    pricePercentChange14d: 0,
    pricePercentChange30d: 0,
    pricePercentChange200d: 0,
    pricePercentChange1y: 0,
    ...overrides,
  };
}

describe('getAccountTrackerControllerAccountsByChainId', () => {
  describe('when assets unify state feature is disabled', () => {
    it('returns accountsByChainId from state unchanged', () => {
      const legacyAccountsByChainId = {
        '0x1': {
          [mockAccountAddressChecksummed]: {
            balance: '0xde0b6b3a7640000' as const,
          },
        },
      };
      const state = {
        metamask: {
          accountsByChainId: legacyAccountsByChainId,
        },
      };
      const result = getAccountTrackerControllerAccountsByChainId(state);

      expect(result).toBe(legacyAccountsByChainId);
      expect(result).toStrictEqual(legacyAccountsByChainId);
    });
  });

  describe('when assets unify state feature is enabled (happy path)', () => {
    it('derives accountsByChainId from new state structure', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
            },
          },
          accountsByChainId: {},
          assetsInfo: {
            [nativeEthAssetId]: { type: 'native', decimals: 18 },
            [erc20AssetId]: { type: 'erc20', decimals: 6 },
          },
          assetsBalance: {
            [mockAccountId]: {
              [nativeEthAssetId]: { amount: '1.23456789' },
              [erc20AssetId]: { amount: '1' },
            },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
              [mockAccountId2]: {
                id: mockAccountId2,
                type: 'solana:data-account',
              },
            },
          },
        },
      };
      const result = getAccountTrackerControllerAccountsByChainId(state);

      expect(result).toStrictEqual({
        '0x1': {
          [mockAccountAddressChecksummed]: {
            balance: '0x112210f4768db400', // 1234567890000000000
          },
        },
      });
    });
  });

  describe('edge cases when enabled', () => {
    it('handles multiple chains for the same EVM account', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          accountsByChainId: {},
          assetsInfo: {
            [nativeEthAssetId]: { type: 'native', decimals: 18 },
            [nativePolygonAssetId]: { type: 'native', decimals: 18 },
          },
          assetsBalance: {
            [mockAccountId]: {
              [nativeEthAssetId]: { amount: '1' },
              [nativePolygonAssetId]: { amount: '2' },
            },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
            },
          },
        },
      };
      const result = getAccountTrackerControllerAccountsByChainId(state);

      expect(result['0x1']).toBeDefined();
      expect(result['0x89']).toBeDefined();
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('handles balance with 0 decimals', () => {
      const zeroDecNativeId = 'eip155:42/slip44:60';
      const state = {
        metamask: {
          ...enabledFlags,
          accountsByChainId: {},
          assetsInfo: {
            [zeroDecNativeId]: { type: 'native', decimals: 0 },
          },
          assetsBalance: {
            [mockAccountId]: {
              [zeroDecNativeId]: { amount: '42' },
            },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
            },
          },
        },
      };
      const result = getAccountTrackerControllerAccountsByChainId(state);

      expect(result['0x2a'][mockAccountAddressChecksummed].balance).toBe(
        '0x2a',
      );
    });

    it('skips balance entries without metadata in assetsInfo', () => {
      const unknownAssetId =
        'eip155:1/erc20:0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
      const state = {
        metamask: {
          ...enabledFlags,
          accountsByChainId: {},
          assetsInfo: {
            [nativeEthAssetId]: { type: 'native', decimals: 18 },
          },
          assetsBalance: {
            [mockAccountId]: {
              [nativeEthAssetId]: { amount: '1' },
              [unknownAssetId]: { amount: '500' },
            },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
            },
          },
        },
      };
      const result = getAccountTrackerControllerAccountsByChainId(state);

      expect(Object.keys(result)).toStrictEqual(['0x1']);
    });

    it('skips non-native assets (ERC-20) from accountsByChainId', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          accountsByChainId: {},
          assetsInfo: {
            [nativeEthAssetId]: { type: 'native', decimals: 18 },
            [erc20AssetId]: { type: 'erc20', decimals: 6 },
          },
          assetsBalance: {
            [mockAccountId]: {
              [nativeEthAssetId]: { amount: '5' },
              [erc20AssetId]: { amount: '1000' },
            },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
            },
          },
        },
      };
      const result = getAccountTrackerControllerAccountsByChainId(state);

      expect(Object.keys(result['0x1'])).toStrictEqual([
        mockAccountAddressChecksummed,
      ]);
    });

    it('truncates fractional digits exceeding decimals in parseBalanceWithDecimals', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          accountsByChainId: {},
          assetsInfo: {
            [nativeEthAssetId]: { type: 'native', decimals: 2 },
          },
          assetsBalance: {
            [mockAccountId]: {
              [nativeEthAssetId]: { amount: '1.23456' },
            },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
            },
          },
        },
      };
      const result = getAccountTrackerControllerAccountsByChainId(state);

      // 1.23456 with 2 decimals → truncated to 1.23 → 123
      expect(result['0x1'][mockAccountAddressChecksummed].balance).toBe('0x7b');
    });
  });
});

describe('getTokensControllerAllTokens', () => {
  describe('when assets unify state feature is disabled', () => {
    it('returns allTokens from state unchanged', () => {
      const legacyAllTokens = {
        '0x1': {
          [mockAccountAddressLowercase]: [
            {
              address: erc20AssetAddressLowercase,
              symbol: 'USDC',
              decimals: 6,
              name: 'USD Coin',
            },
          ],
        },
      };
      const state = {
        metamask: {
          allTokens: legacyAllTokens,
          allIgnoredTokens: {},
        },
      };
      const result = getTokensControllerAllTokens(state);

      expect(result).toBe(legacyAllTokens);
      expect(result).toStrictEqual(legacyAllTokens);
    });
  });

  describe('when assets unify state feature is enabled (happy path)', () => {
    it('derives allTokens from new state structure', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
            },
          },
          allTokens: {},
          allIgnoredTokens: {},
          assetsInfo: {
            [nativeEthAssetId]: { type: 'native', decimals: 18 },
            [erc20AssetId]: {
              type: 'erc20',
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin',
            },
          },
          assetsBalance: {
            [mockAccountId]: {
              [nativeEthAssetId]: { amount: '1' },
              [erc20AssetId]: { amount: '1000000' },
            },
          },
          customAssets: {},
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
              [mockAccountId2]: {
                id: mockAccountId2,
                type: 'solana:data-account',
              },
            },
          },
        },
      };
      const result = getTokensControllerAllTokens(state);

      expect(result).toStrictEqual({
        '0x1': {
          [mockAccountAddressLowercase]: [
            {
              address: erc20AssetAddressChecksummed,
              symbol: 'USDC',
              decimals: 6,
              name: 'USD Coin',
              image: undefined,
            },
          ],
        },
      });
    });
  });

  describe('edge cases when enabled', () => {
    it('includes tokens from customAssets not present in assetsBalance', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          allTokens: {},
          allIgnoredTokens: {},
          assetsInfo: {
            [erc20AssetId]: {
              type: 'erc20',
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin',
              image: 'https://example.com/usdc.png',
            },
          },
          assetsBalance: {},
          customAssets: {
            [mockAccountId]: [erc20AssetId as CaipAssetType],
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
            },
          },
        },
      };
      const result = getTokensControllerAllTokens(state);

      expect(result['0x1'][mockAccountAddressLowercase]).toStrictEqual([
        {
          address: erc20AssetAddressChecksummed,
          symbol: 'USDC',
          decimals: 6,
          name: 'USD Coin',
          image: 'https://example.com/usdc.png',
        },
      ]);
    });

    it('deduplicates tokens present in both assetsBalance and customAssets', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          allTokens: {},
          allIgnoredTokens: {},
          assetsInfo: {
            [erc20AssetId]: {
              type: 'erc20',
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin',
            },
          },
          assetsBalance: {
            [mockAccountId]: {
              [erc20AssetId]: { amount: '1' },
            },
          },
          customAssets: {
            [mockAccountId]: [erc20AssetId as CaipAssetType],
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
            },
          },
        },
      };
      const result = getTokensControllerAllTokens(state);

      expect(result['0x1'][mockAccountAddressLowercase]).toHaveLength(1);
    });

    it('skips assets with no metadata in assetsInfo', () => {
      const unknownAssetId =
        'eip155:1/erc20:0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef' as CaipAssetType;
      const state = {
        metamask: {
          ...enabledFlags,
          allTokens: {},
          allIgnoredTokens: {},
          assetsInfo: {},
          assetsBalance: {
            [mockAccountId]: {
              [unknownAssetId]: { amount: '1' },
            },
          },
          customAssets: {},
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
            },
          },
        },
      };
      const result = getTokensControllerAllTokens(state);

      expect(result).toStrictEqual({});
    });

    it('skips native assets from allTokens (only ERC-20s)', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          allTokens: {},
          allIgnoredTokens: {},
          assetsInfo: {
            [nativeEthAssetId]: {
              type: 'native',
              decimals: 18,
              symbol: 'ETH',
              name: 'Ether',
            },
          },
          assetsBalance: {
            [mockAccountId]: {
              [nativeEthAssetId]: { amount: '1' },
            },
          },
          customAssets: {},
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
            },
          },
        },
      };
      const result = getTokensControllerAllTokens(state);

      expect(result).toStrictEqual({});
    });
  });
});

describe('getTokensControllerAllIgnoredTokens', () => {
  describe('when assets unify state feature is disabled', () => {
    it('returns allIgnoredTokens from state unchanged', () => {
      const legacyAllIgnoredTokens = {
        '0x1': {
          [mockAccountAddressLowercase]: [erc20AssetAddressLowercase],
        },
      };
      const state = {
        metamask: {
          allIgnoredTokens: legacyAllIgnoredTokens,
          allTokens: {},
        },
      };
      const result = getTokensControllerAllIgnoredTokens(state);

      expect(result).toBe(legacyAllIgnoredTokens);
      expect(result).toStrictEqual(legacyAllIgnoredTokens);
    });
  });

  describe('when assets unify state feature is enabled (happy path)', () => {
    it('derives allIgnoredTokens from new state structure', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
            },
          },
          allIgnoredTokens: {},
          allTokens: {},
          assetPreferences: {
            [erc20AssetId]: { hidden: true },
            [solanaTokenAssetId]: { hidden: true },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
              [mockAccountId2]: {
                id: mockAccountId2,
                type: 'solana:data-account',
              },
            },
          },
        },
      };
      const result = getTokensControllerAllIgnoredTokens(state);

      expect(result).toStrictEqual({
        '0x1': {
          [mockAccountAddressLowercase]: [erc20AssetAddressLowercase],
        },
      });
    });
  });

  describe('edge cases when enabled', () => {
    it('skips preferences with hidden set to false', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          allIgnoredTokens: {},
          allTokens: {},

          assetPreferences: {
            [erc20AssetId]: { hidden: false },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
            },
          },
        },
      };
      const result = getTokensControllerAllIgnoredTokens(state);

      expect(result).toStrictEqual({});
    });

    it('applies hidden tokens to all EVM accounts', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          allIgnoredTokens: {},
          allTokens: {},
          assetPreferences: {
            [erc20AssetId]: { hidden: true },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
              [mockAccountId3]: {
                id: mockAccountId3,
                address: mockAccountAddressLowercase2,
                type: 'eip155:eoa',
              },
              [mockAccountId2]: {
                id: mockAccountId2,
                type: 'solana:data-account',
              },
            },
          },
        },
      };
      const result = getTokensControllerAllIgnoredTokens(state);

      expect(result['0x1'][mockAccountAddressLowercase]).toStrictEqual([
        erc20AssetAddressLowercase,
      ]);
      expect(result['0x1'][mockAccountAddressLowercase2]).toStrictEqual([
        erc20AssetAddressLowercase,
      ]);
    });
  });
});

describe('getTokenBalancesControllerTokenBalances', () => {
  const enabledFeatureFlags = {
    [ASSETS_UNIFY_STATE_FLAG]: {
      enabled: true,
      featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
    },
  };

  const baseInternalAccounts = {
    accounts: {
      [mockAccountId]: {
        id: mockAccountId,
        address: mockAccountAddressLowercase,
        type: 'eip155:eoa',
      },
      [mockAccountId2]: {
        id: mockAccountId2,
        type: 'solana:data-account',
      },
    },
  };

  describe('when assets unify state feature is disabled', () => {
    it('returns tokenBalances from state unchanged', () => {
      const legacyTokenBalances = {
        [mockAccountAddressLowercase]: {
          '0x1': {
            [erc20AssetAddressChecksummed]: '0xf4240' as const,
          },
        },
      };
      const state = {
        metamask: {
          tokenBalances: legacyTokenBalances,
        },
      };
      const result = getTokenBalancesControllerTokenBalances(state);

      expect(result).toBe(legacyTokenBalances);
      expect(result).toStrictEqual(legacyTokenBalances);
    });
  });

  describe('when assets unify state feature is enabled (happy path)', () => {
    it('derives tokenBalances from new state structure', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: enabledFeatureFlags,
          tokenBalances: {},
          assetsInfo: {
            [nativeEthAssetId]: { type: 'native', decimals: 18 },
            [erc20AssetId]: { type: 'erc20', decimals: 6 },
          },
          assetsBalance: {
            [mockAccountId]: {
              [nativeEthAssetId]: { amount: '1.23456789' },
              [erc20AssetId]: { amount: '1' },
            },
          },
          customAssets: {},
          internalAccounts: baseInternalAccounts,
        },
      };
      const result = getTokenBalancesControllerTokenBalances(state);

      const nativeAddress = getNativeAssetForChainId('0x1').address;
      expect(result).toStrictEqual({
        [mockAccountAddressLowercase]: {
          '0x1': {
            [nativeAddress]: '0x112210f4768db400', // 1.23456789 ETH (18 decimals)
            [erc20AssetAddressChecksummed]: '0xf4240', // 1 USDC (6 decimals)
          },
        },
      });
    });

    it('adds zero-balance placeholder for custom EVM token not yet in assetsBalance', () => {
      const customTokenAddress: Hex =
        '0x4d5f47fa6a74757f35c14fd3a6ef8e3c9bc514e8';
      const customTokenAssetId = `eip155:1/erc20:${customTokenAddress}`;
      const customTokenAddressChecksummed = toChecksumHexAddress(
        customTokenAddress,
      ) as Hex;

      const state = {
        metamask: {
          remoteFeatureFlags: enabledFeatureFlags,
          tokenBalances: {},
          assetsInfo: {
            [customTokenAssetId]: {
              type: 'erc20',
              decimals: 18,
              symbol: 'aEthWETH',
              name: 'Aave Ethereum WETH',
            },
          },
          assetsBalance: {},
          customAssets: {
            [mockAccountId]: [customTokenAssetId],
          },
          internalAccounts: baseInternalAccounts,
        },
      };
      const result = getTokenBalancesControllerTokenBalances(state);

      expect(result).toStrictEqual({
        [mockAccountAddressLowercase]: {
          '0x1': {
            [customTokenAddressChecksummed]: '0x0',
          },
        },
      });
    });

    it('does not overwrite real balance with zero placeholder', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: enabledFeatureFlags,
          tokenBalances: {},
          assetsInfo: {
            [erc20AssetId]: { type: 'erc20', decimals: 6 },
          },
          assetsBalance: {
            [mockAccountId]: {
              [erc20AssetId]: { amount: '1' },
            },
          },
          customAssets: {
            [mockAccountId]: [erc20AssetId],
          },
          internalAccounts: baseInternalAccounts,
        },
      };
      const result = getTokenBalancesControllerTokenBalances(state);

      expect(result[mockAccountAddressLowercase]['0x1']).toStrictEqual({
        [erc20AssetAddressChecksummed]: '0xf4240', // real balance, not 0x0
      });
    });

    it('skips custom non-EVM tokens', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: enabledFeatureFlags,
          tokenBalances: {},
          assetsInfo: {
            [solanaTokenAssetId]: {
              type: 'token',
              decimals: 6,
              symbol: 'USDC',
            },
          },
          assetsBalance: {},
          customAssets: {
            [mockAccountId2]: [solanaTokenAssetId],
          },
          internalAccounts: baseInternalAccounts,
        },
      };
      const result = getTokenBalancesControllerTokenBalances(state);

      expect(result).toStrictEqual({});
    });
  });

  describe('edge cases when enabled', () => {
    it('skips balance entries without metadata in assetsInfo', () => {
      const unknownAssetId =
        'eip155:1/erc20:0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
      const state = {
        metamask: {
          ...enabledFlags,
          tokenBalances: {},
          assetsInfo: {
            [nativeEthAssetId]: { type: 'native', decimals: 18 },
          },
          assetsBalance: {
            [mockAccountId]: {
              [nativeEthAssetId]: { amount: '1' },
              [unknownAssetId]: { amount: '999' },
            },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
            },
          },
        },
      };
      const result = getTokenBalancesControllerTokenBalances(state);

      const nativeAddress = getNativeAssetForChainId('0x1').address;
      expect(
        Object.keys(result[mockAccountAddressLowercase]['0x1']),
      ).toStrictEqual([nativeAddress]);
    });

    it('handles multiple EVM accounts', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          tokenBalances: {},
          assetsInfo: {
            [erc20AssetId]: { type: 'erc20', decimals: 6 },
          },
          assetsBalance: {
            [mockAccountId]: {
              [erc20AssetId]: { amount: '10' },
            },
            [mockAccountId3]: {
              [erc20AssetId]: { amount: '20' },
            },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
              [mockAccountId3]: {
                id: mockAccountId3,
                address: mockAccountAddressLowercase2,
                type: 'eip155:eoa',
              },
            },
          },
        },
      };
      const result = getTokenBalancesControllerTokenBalances(state);

      expect(result[mockAccountAddressLowercase]).toBeDefined();
      expect(result[mockAccountAddressLowercase2]).toBeDefined();
      expect(
        result[mockAccountAddressLowercase]['0x1'][
          erc20AssetAddressChecksummed
        ],
      ).toBe('0x989680'); // 10 * 10^6
      expect(
        result[mockAccountAddressLowercase2]['0x1'][
          erc20AssetAddressChecksummed
        ],
      ).toBe('0x1312d00'); // 20 * 10^6
    });
  });
});

describe('getMultiChainAssetsControllerAccountsAssets', () => {
  describe('when assets unify state feature is disabled', () => {
    it('returns accountsAssets from state unchanged', () => {
      const legacyAccountsAssets = {
        [mockAccountId2]: [solanaTokenAssetId] as CaipAssetType[],
      };
      const state = {
        metamask: {
          accountsAssets: legacyAccountsAssets,
        },
      };
      const result = getMultiChainAssetsControllerAccountsAssets(state);

      expect(result).toBe(legacyAccountsAssets);
      expect(result).toStrictEqual(legacyAccountsAssets);
    });
  });

  describe('when assets unify state feature is enabled (happy path)', () => {
    it('derives accountsAssets from new state structure for non-EVM accounts only', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
            },
          },
          accountsAssets: {},
          assetsBalance: {
            [mockAccountId]: {
              [nativeEthAssetId]: { amount: '1' },
              [erc20AssetId]: { amount: '1' },
            },
            [mockAccountId2]: {
              [solanaTokenAssetId]: { amount: '100' },
            },
          },
          customAssets: {},
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
              [mockAccountId2]: {
                id: mockAccountId2,
                type: 'solana:data-account',
              },
            },
          },
        },
      };
      const result = getMultiChainAssetsControllerAccountsAssets(state);

      expect(result).toStrictEqual({
        [mockAccountId2]: [solanaTokenAssetId],
      });
    });
  });

  describe('edge cases when enabled', () => {
    it('merges and deduplicates assetsBalance and customAssets', () => {
      const extraSolAssetId =
        'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/token:So11111111111111111111111111111111111111112' as CaipAssetType;
      const state = {
        metamask: {
          ...enabledFlags,
          accountsAssets: {},
          assetsBalance: {
            [mockAccountId2]: {
              [solanaTokenAssetId]: { amount: '100' },
            },
          },
          customAssets: {
            [mockAccountId2]: [
              solanaTokenAssetId as CaipAssetType,
              extraSolAssetId,
            ],
          },
          internalAccounts: {
            accounts: {
              [mockAccountId2]: {
                id: mockAccountId2,
                type: 'solana:data-account',
              },
            },
          },
        },
      };
      const result = getMultiChainAssetsControllerAccountsAssets(state);

      expect(result[mockAccountId2]).toHaveLength(2);
      expect(result[mockAccountId2]).toContain(solanaTokenAssetId);
      expect(result[mockAccountId2]).toContain(extraSolAssetId);
    });

    it('filters out EIP155 assets for non-EVM accounts', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          accountsAssets: {},
          assetsBalance: {
            [mockAccountId2]: {
              [nativeEthAssetId]: { amount: '1' },
              [solanaTokenAssetId]: { amount: '100' },
            },
          },
          customAssets: {},
          internalAccounts: {
            accounts: {
              [mockAccountId2]: {
                id: mockAccountId2,
                type: 'solana:data-account',
              },
            },
          },
        },
      };
      const result = getMultiChainAssetsControllerAccountsAssets(state);

      expect(result[mockAccountId2]).toStrictEqual([solanaTokenAssetId]);
    });

    it('returns empty array when non-EVM account has only EIP155 assets', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          accountsAssets: {},
          assetsBalance: {
            [mockAccountId2]: {
              [nativeEthAssetId]: { amount: '1' },
            },
          },
          customAssets: {},
          internalAccounts: {
            accounts: {
              [mockAccountId2]: {
                id: mockAccountId2,
                type: 'solana:data-account',
              },
            },
          },
        },
      };
      const result = getMultiChainAssetsControllerAccountsAssets(state);

      expect(result[mockAccountId2]).toStrictEqual([]);
    });
  });
});

describe('getMultiChainAssetsControllerAssetsMetadata', () => {
  describe('when assets unify state feature is disabled', () => {
    it('returns assetsMetadata from state unchanged', () => {
      const legacyAssetsMetadata = {
        [solanaTokenAssetId]: {
          fungible: true as const,
          iconUrl: 'https://example.com/sol.png',
          units: [{ decimals: 6, symbol: 'USDC', name: 'USD Coin' }],
          symbol: 'USDC',
          name: 'USD Coin',
        },
      };
      const state = {
        metamask: {
          assetsMetadata: legacyAssetsMetadata,
        },
      };
      const result = getMultiChainAssetsControllerAssetsMetadata(state);

      expect(result).toBe(legacyAssetsMetadata);
      expect(result).toStrictEqual(legacyAssetsMetadata);
    });
  });

  describe('when assets unify state feature is enabled (happy path)', () => {
    it('derives assetsMetadata from assetsInfo for non-EIP155 assets only', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
            },
          },
          assetsMetadata: {},
          assetsInfo: {
            [nativeEthAssetId]: { type: 'native', decimals: 18 },
            [erc20AssetId]: {
              type: 'erc20',
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin',
            },
            [solanaTokenAssetId]: {
              type: 'token',
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin',
              image: 'https://example.com/sol-usdc.png',
            },
          },
        },
      };
      const result = getMultiChainAssetsControllerAssetsMetadata(state);

      expect(result).toStrictEqual({
        [solanaTokenAssetId]: {
          fungible: true,
          iconUrl: 'https://example.com/sol-usdc.png',
          units: [
            {
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin',
            },
          ],
          symbol: 'USDC',
          name: 'USD Coin',
        },
      });
    });
  });

  describe('edge cases when enabled', () => {
    it('defaults iconUrl to empty string when image is undefined', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          assetsMetadata: {},
          assetsInfo: {
            [solanaTokenAssetId]: {
              type: 'token',
              decimals: 9,
              symbol: 'SOL',
              name: 'Solana',
            },
          },
        },
      };
      const result = getMultiChainAssetsControllerAssetsMetadata(state);

      expect(result[solanaTokenAssetId as CaipAssetType].iconUrl).toBe('');
    });

    it('excludes EIP155 assets from multichain metadata', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          assetsMetadata: {},
          assetsInfo: {
            [nativeEthAssetId]: {
              type: 'native',
              decimals: 18,
              symbol: 'ETH',
              name: 'Ether',
            },
            [erc20AssetId]: {
              type: 'erc20',
              decimals: 6,
              symbol: 'USDC',
              name: 'USD Coin',
            },
          },
        },
      };
      const result = getMultiChainAssetsControllerAssetsMetadata(state);

      expect(result).toStrictEqual({});
    });
  });
});

describe('getMultiChainAssetsControllerAllIgnoredAssets', () => {
  describe('when assets unify state feature is disabled', () => {
    it('returns allIgnoredAssets from state unchanged', () => {
      const legacyAllIgnoredAssets = {
        [mockAccountId2]: [solanaTokenAssetId] as CaipAssetType[],
      };
      const state = {
        metamask: {
          allIgnoredAssets: legacyAllIgnoredAssets,
        },
      };
      const result = getMultiChainAssetsControllerAllIgnoredAssets(state);

      expect(result).toBe(legacyAllIgnoredAssets);
      expect(result).toStrictEqual(legacyAllIgnoredAssets);
    });
  });

  describe('when assets unify state feature is enabled (happy path)', () => {
    it('derives allIgnoredAssets from assetPreferences for non-EVM accounts only', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
            },
          },
          allIgnoredAssets: {},
          assetPreferences: {
            [erc20AssetId]: { hidden: true },
            [solanaTokenAssetId]: { hidden: true },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
              [mockAccountId2]: {
                id: mockAccountId2,
                type: 'solana:data-account',
              },
            },
          },
        },
      };
      const result = getMultiChainAssetsControllerAllIgnoredAssets(state);

      expect(result).toStrictEqual({
        [mockAccountId2]: [solanaTokenAssetId],
      });
    });
  });

  describe('edge cases when enabled', () => {
    it('skips preferences with hidden set to false', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          allIgnoredAssets: {},
          assetPreferences: {
            [solanaTokenAssetId]: { hidden: false },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId2]: {
                id: mockAccountId2,
                type: 'solana:data-account',
              },
            },
          },
        },
      };
      const result = getMultiChainAssetsControllerAllIgnoredAssets(state);

      expect(result[mockAccountId2]).toStrictEqual([]);
    });

    it('skips EIP155 assets from ignored assets list', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          allIgnoredAssets: {},
          assetPreferences: {
            [erc20AssetId]: { hidden: true },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId2]: {
                id: mockAccountId2,
                type: 'solana:data-account',
              },
            },
          },
        },
      };
      const result = getMultiChainAssetsControllerAllIgnoredAssets(state);

      expect(result[mockAccountId2]).toStrictEqual([]);
    });

    it('skips EVM accounts entirely', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          allIgnoredAssets: {},
          assetPreferences: {
            [solanaTokenAssetId]: { hidden: true },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
            },
          },
        },
      };
      const result = getMultiChainAssetsControllerAllIgnoredAssets(state);

      expect(result).toStrictEqual({});
    });
  });
});

describe('getMultiChainBalancesControllerBalances', () => {
  describe('when assets unify state feature is disabled', () => {
    it('returns balances from state unchanged', () => {
      const legacyBalances = {
        [mockAccountId2]: {
          [solanaTokenAssetId]: { amount: '100', unit: 'USDC' },
        },
      };
      const state = {
        metamask: {
          balances: legacyBalances,
        },
      };
      const result = getMultiChainBalancesControllerBalances(state);

      expect(result).toBe(legacyBalances);
      expect(result).toStrictEqual(legacyBalances);
    });
  });

  describe('when assets unify state feature is enabled (happy path)', () => {
    it('derives balances from new state structure for non-EVM accounts only', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
            },
          },
          balances: {},
          assetsInfo: {
            [nativeEthAssetId]: { type: 'native', decimals: 18 },
            [erc20AssetId]: { type: 'erc20', decimals: 6, symbol: 'USDC' },
            [solanaTokenAssetId]: {
              type: 'token',
              decimals: 6,
              symbol: 'USDC',
            },
          },
          assetsBalance: {
            [mockAccountId]: {
              [nativeEthAssetId]: { amount: '1' },
              [erc20AssetId]: { amount: '1' },
            },
            [mockAccountId2]: {
              [solanaTokenAssetId]: { amount: '250.5' },
            },
          },
          internalAccounts: {
            accounts: {
              [mockAccountId]: {
                id: mockAccountId,
                address: mockAccountAddressLowercase,
                type: 'eip155:eoa',
              },
              [mockAccountId2]: {
                id: mockAccountId2,
                type: 'solana:data-account',
              },
            },
          },
        },
      };
      const result = getMultiChainBalancesControllerBalances(state);

      expect(result).toStrictEqual({
        [mockAccountId2]: {
          [solanaTokenAssetId]: { amount: '250.5', unit: 'USDC' },
        },
      });
    });
  });
});

describe('getCurrencyRateControllerCurrentCurrency', () => {
  describe('when assets unify state feature is disabled', () => {
    it('returns currentCurrency from state unchanged', () => {
      const legacyCurrentCurrency = 'eur';
      const state = {
        metamask: {
          currentCurrency: legacyCurrentCurrency,
        },
      };
      const result = getCurrencyRateControllerCurrentCurrency(state);

      expect(result).toBe(legacyCurrentCurrency);
    });
  });

  describe('when assets unify state feature is enabled', () => {
    it('returns selectedCurrency from new state', () => {
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
            },
          },
          currentCurrency: 'eur',
          selectedCurrency: 'usd',
        },
      };
      const result = getCurrencyRateControllerCurrentCurrency(state);

      expect(result).toBe('usd');
    });
  });
});

describe('getCurrencyRateControllerCurrencyRates', () => {
  describe('when assets unify state feature is disabled', () => {
    it('returns currencyRates from state unchanged', () => {
      const legacyCurrencyRates = {
        ETH: {
          conversionDate: 1000,
          conversionRate: 2000,
          usdConversionRate: 2000,
        },
      };
      const state = {
        metamask: {
          currencyRates: legacyCurrencyRates,
        },
      };
      const result = getCurrencyRateControllerCurrencyRates(state);

      expect(result).toBe(legacyCurrencyRates);
      expect(result).toStrictEqual(legacyCurrencyRates);
    });
  });

  describe('when assets unify state feature is enabled (happy path)', () => {
    it('derives currencyRates from assetsInfo and assetsPrice for native EVM assets', () => {
      const lastUpdated = 1700000000000; // ms
      const mockNonFungibleAssetId = 'eip155:137/slip44:987654321';
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
            },
          },
          currentCurrency: 'eur',
          selectedCurrency: 'eur',
          currencyRates: {},
          assetsInfo: {
            [nativeEthAssetId]: { type: 'native', symbol: 'ETH', decimals: 18 },
            [erc20AssetId]: {
              type: 'erc20',
              symbol: 'USDC',
              decimals: 6,
            },
            [mockNonFungibleAssetId]: {
              type: 'something',
              symbol: 'SMT',
            },
          },
          assetsPrice: {
            [nativeEthAssetId]: {
              assetPriceType: 'fungible',
              id: 'eth-price',
              price: 2500,
              usdPrice: 3000,
              lastUpdated,
              marketCap: 300000000000,
              allTimeHigh: 4000,
              allTimeLow: 500,
              totalVolume: 1000000,
              high1d: 2600,
              low1d: 2400,
              circulatingSupply: 120000000,
              dilutedMarketCap: 300000000000,
              marketCapPercentChange1d: 2,
              priceChange1d: 50,
              pricePercentChange1h: 0.5,
              pricePercentChange1d: 2,
              pricePercentChange7d: 5,
              pricePercentChange14d: 8,
              pricePercentChange30d: 10,
              pricePercentChange200d: 20,
              pricePercentChange1y: 30,
            },
            [mockNonFungibleAssetId]: {
              assetPriceType: 'something',
              id: 'smt-price',
              price: 0.5,
              lastUpdated,
            },
          },
        },
      };
      const result = getCurrencyRateControllerCurrencyRates(state);

      expect(result).toStrictEqual({
        ETH: {
          conversionDate: lastUpdated / 1000,
          conversionRate: 2500,
          usdConversionRate: 3000,
        },
      });
    });
  });
});

describe('getTokenRatesControllerMarketData', () => {
  describe('when assets unify state feature is disabled', () => {
    it('returns marketData from state unchanged', () => {
      const legacyMarketData = {
        '0x1': {
          [erc20AssetAddressChecksummed]: {
            tokenAddress: erc20AssetAddressChecksummed,
            currency: 'ETH',
            price: 1,
            marketCap: 0,
            allTimeHigh: 0,
            allTimeLow: 0,
            totalVolume: 0,
            high1d: 0,
            low1d: 0,
            circulatingSupply: 0,
            dilutedMarketCap: 0,
            marketCapPercentChange1d: 0,
            priceChange1d: 0,
            pricePercentChange1h: 0,
            pricePercentChange1d: 0,
            pricePercentChange7d: 0,
            pricePercentChange14d: 0,
            pricePercentChange30d: 0,
            pricePercentChange200d: 0,
            pricePercentChange1y: 0,
          },
        },
      };
      const state = {
        metamask: {
          marketData: legacyMarketData,
        },
      };
      const result = getTokenRatesControllerMarketData(state);

      expect(result).toBe(legacyMarketData);
      expect(result).toStrictEqual(legacyMarketData);
    });
  });

  describe('when assets unify state feature is enabled (happy path)', () => {
    it('derives marketData from assetsPrice with prices converted to native currency', () => {
      const lastUpdated = 1700000000000;
      const ethPriceInUsd = 2000;
      const usdcPriceInUsd = 1;
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
            },
          },
          marketData: {},
          currentCurrency: 'usd',
          selectedCurrency: 'usd',
          currencyRates: {},
          assetsInfo: {
            [nativeEthAssetId]: { type: 'native', symbol: 'ETH', decimals: 18 },
            [erc20AssetId]: {
              type: 'erc20',
              symbol: 'USDC',
              decimals: 6,
            },
          },
          assetsPrice: {
            [nativeEthAssetId]: {
              assetPriceType: 'fungible',
              id: 'eth-price',
              price: ethPriceInUsd,
              usdPrice: ethPriceInUsd,
              lastUpdated,
              marketCap: 300e9,
              allTimeHigh: 4000,
              allTimeLow: 500,
              totalVolume: 1e9,
              high1d: 2100,
              low1d: 1900,
              circulatingSupply: 120e6,
              dilutedMarketCap: 300e9,
              marketCapPercentChange1d: 2,
              priceChange1d: 50,
              pricePercentChange1h: 0.5,
              pricePercentChange1d: 2,
              pricePercentChange7d: 5,
              pricePercentChange14d: 8,
              pricePercentChange30d: 10,
              pricePercentChange200d: 20,
              pricePercentChange1y: 30,
            },
            [erc20AssetId]: {
              assetPriceType: 'fungible',
              id: 'usdc-price',
              price: usdcPriceInUsd,
              usdPrice: usdcPriceInUsd,
              lastUpdated,
              marketCap: 30e9,
              allTimeHigh: 1.1,
              allTimeLow: 0.9,
              totalVolume: 100e9,
              high1d: 1.01,
              low1d: 0.99,
              circulatingSupply: 30e9,
              dilutedMarketCap: 30e9,
              marketCapPercentChange1d: 0,
              priceChange1d: 0,
              pricePercentChange1h: 0,
              pricePercentChange1d: 0,
              pricePercentChange7d: 0,
              pricePercentChange14d: 0,
              pricePercentChange30d: 0,
              pricePercentChange200d: 0,
              pricePercentChange1y: 0,
            },
          },
          networkConfigurationsByChainId: {
            '0x1': { nativeCurrency: 'ETH' },
          },
        },
      };
      const result = getTokenRatesControllerMarketData(state);

      // ETH native rate is 2000 USD; USDC price 1 USD -> 1/2000 ETH
      const marketData = result['0x1'][erc20AssetAddressChecksummed];
      expect(marketData.price).toBe(usdcPriceInUsd / ethPriceInUsd);
      expect(marketData.currency).toBe('ETH');
      expect(marketData.tokenAddress).toBe(erc20AssetAddressChecksummed);
    });
  });

  describe('edge cases when enabled', () => {
    it('skips non-EIP155 assets from marketData', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          marketData: {},
          currentCurrency: 'usd',
          selectedCurrency: 'usd',
          currencyRates: {},
          assetsInfo: {
            [nativeEthAssetId]: {
              type: 'native',
              symbol: 'ETH',
              decimals: 18,
            },
            [solanaTokenAssetId]: {
              type: 'token',
              symbol: 'USDC',
              decimals: 6,
            },
          },
          assetsPrice: {
            [nativeEthAssetId]: makeMockPrice({ id: 'eth', price: 2000 }),
            [solanaTokenAssetId]: makeMockPrice({
              id: 'sol-usdc',
              price: 1,
            }),
          },
          networkConfigurationsByChainId: {
            '0x1': { nativeCurrency: 'ETH' },
          },
        },
      };
      const result = getTokenRatesControllerMarketData(state);

      expect(result['0x1']).toBeDefined();
      expect(Object.keys(result).every((key) => key.startsWith('0x'))).toBe(
        true,
      );
    });

    it('skips assets without metadata in assetsInfo', () => {
      const unknownAssetId =
        'eip155:1/erc20:0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
      const state = {
        metamask: {
          ...enabledFlags,
          marketData: {},
          currentCurrency: 'usd',
          selectedCurrency: 'usd',
          currencyRates: {},
          assetsInfo: {
            [nativeEthAssetId]: {
              type: 'native',
              symbol: 'ETH',
              decimals: 18,
            },
          },
          assetsPrice: {
            [nativeEthAssetId]: makeMockPrice({
              id: 'eth',
              price: 2000,
            }),
            [unknownAssetId]: makeMockPrice({
              id: 'unknown',
              price: 42,
            }),
          },
          networkConfigurationsByChainId: {
            '0x1': { nativeCurrency: 'ETH' },
          },
        },
      };
      const result = getTokenRatesControllerMarketData(state);

      expect(Object.keys(result['0x1'])).toHaveLength(1);
    });

    it('skips assets when native currency conversion rate is unavailable', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          marketData: {},
          currentCurrency: 'usd',
          selectedCurrency: 'usd',
          currencyRates: {},
          assetsInfo: {
            [erc20AssetId]: {
              type: 'erc20',
              symbol: 'USDC',
              decimals: 6,
            },
          },
          assetsPrice: {
            [erc20AssetId]: makeMockPrice({ id: 'usdc', price: 1 }),
          },
          networkConfigurationsByChainId: {
            '0x1': { nativeCurrency: 'ETH' },
          },
        },
      };
      const result = getTokenRatesControllerMarketData(state);

      expect(result).toStrictEqual({});
    });

    it('places native slip44 asset at getNativeTokenAddress', () => {
      const nativeTokenAddress = '0x0000000000000000000000000000000000000000';
      const state = {
        metamask: {
          ...enabledFlags,
          marketData: {},
          currentCurrency: 'usd',
          selectedCurrency: 'usd',
          currencyRates: {},
          assetsInfo: {
            [nativeEthAssetId]: {
              type: 'native',
              symbol: 'ETH',
              decimals: 18,
            },
          },
          assetsPrice: {
            [nativeEthAssetId]: makeMockPrice({ id: 'eth', price: 2000 }),
          },
          networkConfigurationsByChainId: {
            '0x1': { nativeCurrency: 'ETH' },
          },
        },
      };
      const result = getTokenRatesControllerMarketData(state);

      expect(result['0x1'][nativeTokenAddress]).toBeDefined();
      expect(result['0x1'][nativeTokenAddress].tokenAddress).toBe(
        nativeTokenAddress,
      );
      expect(result['0x1'][nativeTokenAddress].price).toBe(1);
    });

    it('converts all price fields to native currency denomination', () => {
      const ethPrice = 2500;
      const state = {
        metamask: {
          ...enabledFlags,
          marketData: {},
          currentCurrency: 'usd',
          selectedCurrency: 'usd',
          currencyRates: {},
          assetsInfo: {
            [nativeEthAssetId]: {
              type: 'native',
              symbol: 'ETH',
              decimals: 18,
            },
            [erc20AssetId]: {
              type: 'erc20',
              symbol: 'USDC',
              decimals: 6,
            },
          },
          assetsPrice: {
            [nativeEthAssetId]: makeMockPrice({ id: 'eth', price: ethPrice }),
            [erc20AssetId]: makeMockPrice({
              id: 'usdc',
              price: 1,
              marketCap: 30e9,
              allTimeHigh: 1.1,
              allTimeLow: 0.9,
              totalVolume: 100e9,
              high1d: 1.01,
              low1d: 0.99,
              dilutedMarketCap: 30e9,
              circulatingSupply: 30e9,
            }),
          },
          networkConfigurationsByChainId: {
            '0x1': { nativeCurrency: 'ETH' },
          },
        },
      };
      const result = getTokenRatesControllerMarketData(state);
      const md = result['0x1'][erc20AssetAddressChecksummed];

      expect(md.price).toBe(1 / ethPrice);
      expect(md.marketCap).toBe(30e9 / ethPrice);
      expect(md.allTimeHigh).toBe(1.1 / ethPrice);
      expect(md.allTimeLow).toBe(0.9 / ethPrice);
      expect(md.totalVolume).toBe(100e9 / ethPrice);
      expect(md.high1d).toBe(1.01 / ethPrice);
      expect(md.low1d).toBe(0.99 / ethPrice);
      expect(md.dilutedMarketCap).toBe(30e9 / ethPrice);
      // circulatingSupply is NOT converted
      expect(md.circulatingSupply).toBe(30e9);
    });

    it('does not use slip44 fallback for ERC-20 assets missing from assetsInfo', () => {
      const ethPrice = 2000;
      const nativeTokenAddress = '0x0000000000000000000000000000000000000000';
      const orphanErc20AssetId =
        'eip155:1/erc20:0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
      const state = {
        metamask: {
          ...enabledFlags,
          marketData: {},
          currentCurrency: 'usd',
          selectedCurrency: 'usd',
          currencyRates: {},
          assetsInfo: {
            [nativeEthAssetId]: {
              type: 'native',
              symbol: 'ETH',
              decimals: 18,
            },
          },
          assetsPrice: {
            [nativeEthAssetId]: makeMockPrice({ id: 'eth', price: ethPrice }),
            [orphanErc20AssetId]: makeMockPrice({
              id: 'orphan',
              price: 999,
            }),
          },
          networkConfigurationsByChainId: {
            '0x1': { nativeCurrency: 'ETH' },
          },
        },
      };
      const result = getTokenRatesControllerMarketData(state);

      // The native entry should still be the native price, not overwritten
      expect(result['0x1'][nativeTokenAddress].price).toBe(1);
      // The orphan ERC-20 should be skipped entirely (no metadata)
      const checksumOrphan = toChecksumHexAddress(
        '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      ) as Hex;
      expect(result['0x1'][checksumOrphan]).toBeUndefined();
    });
  });
});

describe('getMultichainAssetsRatesControllerConversionRates', () => {
  describe('when assets unify state feature is disabled', () => {
    it('returns conversionRates from state unchanged', () => {
      const legacyConversionRates = {
        [solanaTokenAssetId]: {
          rate: '1',
          conversionTime: 1700000000000,
          expirationTime: undefined,
          marketData: {
            fungible: true as const,
            allTimeHigh: '1.1',
            allTimeLow: '0.9',
            circulatingSupply: '1000000',
            marketCap: '1000000',
            totalVolume: '500000',
            pricePercentChange: {
              PT1H: 0,
              P1D: 0,
              P7D: 0,
              P14D: 0,
              P30D: 0,
              P200D: 0,
              P1Y: 0,
            },
          },
        },
      };
      const state = {
        metamask: {
          conversionRates: legacyConversionRates,
        },
      };
      const result = getMultichainAssetsRatesControllerConversionRates(state);

      expect(result).toBe(legacyConversionRates);
      expect(result).toStrictEqual(legacyConversionRates);
    });
  });

  describe('when assets unify state feature is enabled (happy path)', () => {
    it('derives conversionRates from assetsPrice for non-EVM assets only', () => {
      const lastUpdated = 1700000000000;
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
            },
          },
          conversionRates: {},
          assetsPrice: {
            [nativeEthAssetId]: {
              assetPriceType: 'fungible',
              id: 'eth-price',
              price: 2000,
              usdPrice: 2000,
              lastUpdated,
              marketCap: 300e9,
              allTimeHigh: 4000,
              allTimeLow: 500,
              totalVolume: 1e9,
              high1d: 2100,
              low1d: 1900,
              circulatingSupply: 120e6,
              dilutedMarketCap: 300e9,
              marketCapPercentChange1d: 2,
              priceChange1d: 50,
              pricePercentChange1h: 0.5,
              pricePercentChange1d: 2,
              pricePercentChange7d: 5,
              pricePercentChange14d: 8,
              pricePercentChange30d: 10,
              pricePercentChange200d: 20,
              pricePercentChange1y: 30,
            },
            [solanaTokenAssetId]: {
              assetPriceType: 'fungible',
              id: 'sol-usdc-price',
              price: 1.02,
              usdPrice: 1.02,
              lastUpdated,
              marketCap: 30e9,
              allTimeHigh: 1.1,
              allTimeLow: 0.95,
              totalVolume: 100e9,
              high1d: 1.03,
              low1d: 1.01,
              circulatingSupply: 30e9,
              dilutedMarketCap: 30e9,
              marketCapPercentChange1d: 0.5,
              priceChange1d: 0.01,
              pricePercentChange1h: 0.1,
              pricePercentChange1d: 0.5,
              pricePercentChange7d: 1,
              pricePercentChange14d: 1.5,
              pricePercentChange30d: 2,
              pricePercentChange200d: 3,
              pricePercentChange1y: 5,
            },
          },
        },
      };
      const result = getMultichainAssetsRatesControllerConversionRates(state);

      expect(result[nativeEthAssetId]).toBeUndefined();
      expect(result[solanaTokenAssetId]).toStrictEqual({
        rate: '1.02',
        conversionTime: lastUpdated,
        expirationTime: undefined,
        marketData: {
          fungible: true,
          allTimeHigh: '1.1',
          allTimeLow: '0.95',
          circulatingSupply: '30000000000',
          marketCap: '30000000000',
          totalVolume: '100000000000',
          pricePercentChange: {
            PT1H: 0.1,
            P1D: 0.5,
            P7D: 1,
            P14D: 1.5,
            P30D: 2,
            P200D: 3,
            P1Y: 5,
          },
        },
      });
    });
  });

  describe('edge cases when enabled', () => {
    it('returns empty result when only EVM assets exist in assetsPrice', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          conversionRates: {},
          assetsPrice: {
            [nativeEthAssetId]: makeMockPrice({ id: 'eth', price: 2000 }),
            [erc20AssetId]: makeMockPrice({ id: 'usdc', price: 1 }),
          },
        },
      };
      const result = getMultichainAssetsRatesControllerConversionRates(state);

      expect(result).toStrictEqual({});
    });

    it('converts all market data fields to strings', () => {
      const lastUpdated = 1700000000000;
      const state = {
        metamask: {
          ...enabledFlags,
          conversionRates: {},
          assetsPrice: {
            [solanaTokenAssetId]: makeMockPrice({
              id: 'sol-usdc',
              price: 1.5,
              lastUpdated,
              allTimeHigh: 2.0,
              allTimeLow: 0.8,
              circulatingSupply: 1e9,
              marketCap: 1.5e9,
              totalVolume: 5e8,
            }),
          },
        },
      };
      const result = getMultichainAssetsRatesControllerConversionRates(state);

      const entry = result[solanaTokenAssetId];
      expect(entry.rate).toBe('1.5');
      expect(entry.conversionTime).toBe(lastUpdated);
      expect(entry.expirationTime).toBeUndefined();
      expect(entry.marketData?.allTimeHigh).toBe('2');
      expect(entry.marketData?.allTimeLow).toBe('0.8');
      expect(entry.marketData?.circulatingSupply).toBe('1000000000');
      expect(entry.marketData?.marketCap).toBe('1500000000');
      expect(entry.marketData?.totalVolume).toBe('500000000');
    });

    it('handles empty assetsPrice', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          conversionRates: {},
          assetsPrice: {},
        },
      };
      const result = getMultichainAssetsRatesControllerConversionRates(state);

      expect(result).toStrictEqual({});
    });
  });
});

describe('getRatesControllerRates', () => {
  const solanaNativeAssetId =
    'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp/slip44:501';

  describe('when assets unify state feature is disabled', () => {
    it('returns rates from state unchanged', () => {
      const legacyRates = {
        btc: {
          conversionDate: 1700000000000,
          conversionRate: 71052.43,
          usdConversionRate: 71052.43,
        },
        sol: {
          conversionDate: 1700000000000,
          conversionRate: 91.69,
          usdConversionRate: 91.69,
        },
      };
      const state = {
        metamask: {
          rates: legacyRates,
        },
      };
      const result = getRatesControllerRates(state);

      expect(result).toBe(legacyRates);
      expect(result).toStrictEqual(legacyRates);
    });
  });

  describe('when assets unify state feature is enabled (happy path)', () => {
    it('derives rates from assetsInfo and assetsPrice for non-EVM native assets', () => {
      const lastUpdated = 1700000000000;
      const state = {
        metamask: {
          ...enabledFlags,
          rates: {},
          assetsInfo: {
            [nativeEthAssetId]: {
              type: 'native',
              symbol: 'ETH',
              decimals: 18,
            },
            [bitcoinNativeAssetId]: {
              type: 'native',
              symbol: 'BTC',
              decimals: 8,
            },
            [solanaNativeAssetId]: {
              type: 'native',
              symbol: 'SOL',
              decimals: 9,
            },
          },
          assetsPrice: {
            [nativeEthAssetId]: makeMockPrice({
              id: 'eth',
              price: 2000,
              usdPrice: 2000,
              lastUpdated,
            }),
            [bitcoinNativeAssetId]: makeMockPrice({
              id: 'btc',
              price: 71052.43,
              usdPrice: 71052.43,
              lastUpdated,
            }),
            [solanaNativeAssetId]: makeMockPrice({
              id: 'sol',
              price: 91.69,
              usdPrice: 91.69,
              lastUpdated,
            }),
          },
        },
      };
      const result = getRatesControllerRates(state);

      expect(result.eth).toBeUndefined();
      expect(result).toStrictEqual({
        btc: {
          conversionDate: lastUpdated,
          conversionRate: 71052.43,
          usdConversionRate: 71052.43,
        },
        sol: {
          conversionDate: lastUpdated,
          conversionRate: 91.69,
          usdConversionRate: 91.69,
        },
      });
    });
  });
});

describe('getRatesControllerFiatCurrency', () => {
  describe('when assets unify state feature is disabled', () => {
    it('returns fiatCurrency from state unchanged', () => {
      const state = {
        metamask: {
          fiatCurrency: 'eur',
        },
      };
      const result = getRatesControllerFiatCurrency(state);

      expect(result).toBe('eur');
    });
  });

  describe('when assets unify state feature is enabled', () => {
    it('returns selectedCurrency from new state', () => {
      const state = {
        metamask: {
          ...enabledFlags,
          fiatCurrency: 'eur',
          selectedCurrency: 'usd',
        },
      };
      const result = getRatesControllerFiatCurrency(state);

      expect(result).toBe('usd');
    });
  });
});
