import { Hex } from '@metamask/utils';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import {
  ASSETS_UNIFY_STATE_FLAG,
  ASSETS_UNIFY_STATE_VERSION_1,
} from '../../lib/assets-unify-state/remote-feature-flag';
import { getAccountTrackerControllerAccountsByChainId } from './assets-migration';

describe('getAccountTrackerControllerAccountsByChainId', () => {
  const mockAccountId = 'mock-account-id';
  const mockAddress = '0x1234567890123456789012345678901234567890';
  const checksummedAddress = toChecksumHexAddress(mockAddress);
  // Native ETH on mainnet (chain 1)
  const nativeAssetId = 'eip155:1/slip44:60';

  const assetsUnifyStateEnabled = {
    [ASSETS_UNIFY_STATE_FLAG]: {
      enabled: true,
      featureVersion: ASSETS_UNIFY_STATE_VERSION_1,
      minimumVersion: null,
    },
  };

  const createMockState = (
    overrides: {
      remoteFeatureFlags?: Record<string, unknown>;
      accountsByChainId?: Record<Hex, Record<string, { balance: Hex }>>;
      assetsInfo?: Record<string, { type: string; decimals: number }>;
      assetsBalance?: Record<string, Record<string, { amount: string }>>;
      internalAccounts?: {
        accounts: Record<string, { id: string; address: string; type: string }>;
      };
    } = {},
  ) => {
    const {
      remoteFeatureFlags = {},
      accountsByChainId = {},
      assetsInfo = {
        [nativeAssetId]: { type: 'native', decimals: 18 },
      },
      assetsBalance = {
        [mockAccountId]: {
          [nativeAssetId]: { amount: '1' },
        },
      },
      internalAccounts = {
        accounts: {
          [mockAccountId]: {
            id: mockAccountId,
            address: mockAddress,
            type: 'eip155:eoa',
          },
        },
      },
    } = overrides;

    return {
      metamask: {
        remoteFeatureFlags,
        accountsByChainId,
        assetsInfo,
        assetsBalance,
        internalAccounts: { accounts: internalAccounts.accounts },
      },
    };
  };

  describe('when assets unify state feature is disabled', () => {
    it('returns accountsByChainId from state unchanged', () => {
      const legacyAccountsByChainId = {
        '0x1': {
          [checksummedAddress]: { balance: '0xde0b6b3a7640000' as const },
        },
      };
      const state = createMockState({
        remoteFeatureFlags: {},
        accountsByChainId: legacyAccountsByChainId,
      });
      const result = getAccountTrackerControllerAccountsByChainId(state);

      expect(result).toBe(legacyAccountsByChainId);
      expect(result).toStrictEqual(legacyAccountsByChainId);
    });
  });

  describe('when assets unify state feature is enabled (happy path)', () => {
    it('derives accountsByChainId from assetsBalance, assetsInfo, and internalAccounts', () => {
      const state = createMockState({
        remoteFeatureFlags: assetsUnifyStateEnabled,
      });
      const result = getAccountTrackerControllerAccountsByChainId(state);

      expect(result).toStrictEqual({
        '0x1': {
          [checksummedAddress]: {
            balance: '0xde0b6b3a7640000', // 1 ETH in wei
          },
        },
      });
    });

    it('includes multiple chains when account has native balances on each', () => {
      const chainIdSepolia = 'eip155:11155111/slip44:60';
      const state = createMockState({
        remoteFeatureFlags: assetsUnifyStateEnabled,
        assetsInfo: {
          [nativeAssetId]: { type: 'native', decimals: 18 },
          [chainIdSepolia]: { type: 'native', decimals: 18 },
        },
        assetsBalance: {
          [mockAccountId]: {
            [nativeAssetId]: { amount: '1' },
            [chainIdSepolia]: { amount: '0.5' },
          },
        },
      });

      const result = getAccountTrackerControllerAccountsByChainId(state);

      expect(result['0x1']).toStrictEqual({
        [checksummedAddress]: { balance: '0xde0b6b3a7640000' },
      });
      expect(result['0xaa36a7']).toStrictEqual({
        [checksummedAddress]: { balance: '0x6f05b59d3b20000' }, // 0.5 ETH in wei
      });
    });

    it('aggregates multiple accounts on the same chain', () => {
      const accountId2 = 'mock-account-id-2';
      const address2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
      const state = createMockState({
        remoteFeatureFlags: assetsUnifyStateEnabled,
        assetsBalance: {
          [mockAccountId]: { [nativeAssetId]: { amount: '1' } },
          [accountId2]: { [nativeAssetId]: { amount: '2' } },
        },
        internalAccounts: {
          accounts: {
            [mockAccountId]: {
              id: mockAccountId,
              address: mockAddress,
              type: 'eip155:eoa',
            },
            [accountId2]: {
              id: accountId2,
              address: address2,
              type: 'eip155:eoa',
            },
          },
        },
      });

      const result = getAccountTrackerControllerAccountsByChainId(state);

      expect(result['0x1']).toStrictEqual({
        [checksummedAddress]: { balance: '0xde0b6b3a7640000' },
        [toChecksumHexAddress(address2)]: { balance: '0x1bc16d674ec80000' }, // 2 ETH in wei
      });
    });
  });
});
