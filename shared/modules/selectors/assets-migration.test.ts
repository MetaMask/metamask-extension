import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import type { CaipAssetType, Hex } from '@metamask/utils';
import {
  ASSETS_UNIFY_STATE_FLAG,
  ASSETS_UNIFY_STATE_VERSION_1,
} from '../../lib/assets-unify-state/remote-feature-flag';
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
} from './assets-migration';

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
              minimumVersion: null,
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
          allDetectedTokens: {},
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
              minimumVersion: null,
            },
          },
          allTokens: {},
          allIgnoredTokens: {},
          allDetectedTokens: {},
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
          allDetectedTokens: {},
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
              minimumVersion: null,
            },
          },
          allIgnoredTokens: {},
          allTokens: {},
          allDetectedTokens: {},
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
});

describe('getTokenBalancesControllerTokenBalances', () => {
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
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
              minimumVersion: null,
            },
          },
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
              minimumVersion: null,
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
              minimumVersion: null,
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
              minimumVersion: null,
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
              minimumVersion: null,
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
              minimumVersion: null,
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
      const state = {
        metamask: {
          remoteFeatureFlags: {
            [ASSETS_UNIFY_STATE_FLAG]: {
              enabled: true,
              featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
              minimumVersion: null,
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
              minimumVersion: null,
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
              minimumVersion: null,
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
});
