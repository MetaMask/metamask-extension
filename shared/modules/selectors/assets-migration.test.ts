import { toChecksumHexAddress } from '@metamask/controller-utils';
import {
  ASSETS_UNIFY_STATE_FLAG,
  ASSETS_UNIFY_STATE_VERSION_1,
} from '../../lib/assets-unify-state/remote-feature-flag';
import { getAccountTrackerControllerAccountsByChainId } from './assets-migration';

const mockAccountId = 'mock-account-id-1';
const mockAccountId2 = 'mock-account-id-2';

const mockAccountAddress = '0x1234567890123456789012345678901234567890';
const checksummedAccountAddress = toChecksumHexAddress(mockAccountAddress);

const nativeEthAssetId = 'eip155:1/slip44:60';
const erc20AssetId =
  'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';

describe('getAccountTrackerControllerAccountsByChainId', () => {
  describe('when assets unify state feature is disabled', () => {
    it('returns accountsByChainId from state unchanged', () => {
      const legacyAccountsByChainId = {
        '0x1': {
          [checksummedAccountAddress]: {
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
    it('derives accountsByChainId from assetsBalance, assetsInfo, and internalAccounts', () => {
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
                address: mockAccountAddress,
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
          [checksummedAccountAddress]: {
            balance: '0x112210f4768db400', // 1234567890000000000
          },
        },
      });
    });
  });
});
