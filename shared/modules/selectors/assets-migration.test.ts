import { toChecksumHexAddress } from '@metamask/controller-utils';
import {
  ASSETS_UNIFY_STATE_FLAG,
  ASSETS_UNIFY_STATE_VERSION_1,
} from '../../lib/assets-unify-state/remote-feature-flag';
import {
  getAccountTrackerControllerAccountsByChainId,
  getTokensControllerAllTokens,
  getTokensControllerAllIgnoredTokens,
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
