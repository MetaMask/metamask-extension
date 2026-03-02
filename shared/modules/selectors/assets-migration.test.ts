import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import type { CaipAssetType } from '@metamask/utils';
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
} from './assets-migration';

const mockAccountId = 'mock-account-id-1';
const mockAccountId2 = 'mock-account-id-2';

const mockAccountAddressLowercase =
  '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
const mockAccountAddressChecksummed = toChecksumHexAddress(
  mockAccountAddressLowercase,
);

const nativeEthAssetId = 'eip155:1/slip44:60';
const erc20AssetAddressLowercase = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
const erc20AssetAddressChecksummed = toChecksumHexAddress(
  erc20AssetAddressLowercase,
);
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
