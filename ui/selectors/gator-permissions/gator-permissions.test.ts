import type {
  GatorPermissionsList,
  AccountSigner,
  Erc20TokenStreamPermission,
  NativeTokenPeriodicPermission,
  NativeTokenStreamPermission,
  PermissionTypes,
  StoredGatorPermission,
} from '@metamask/gator-permissions-controller';
import { getGatorAssetList } from './gator-permissions';
import { Hex } from '@metamask/utils';

import {
  getGatorPermissionsList,
  getGatorPermissionByPermissionTypeAndChainId,
  getGatorAssetListDetail,
} from './gator-permissions';

const MOCK_CHAIN_ID_MAINNET = '0x1' as Hex;
const MOCK_CHAIN_ID_POLYGON = '0x89' as Hex;

type MockGatorPermissionsStorageEntriesConfig = {
  [chainId: string]: {
    nativeTokenStream: number;
    nativeTokenPeriodic: number;
    erc20TokenStream: number;
    siteOrigin: string;
  };
};

/**
 * Creates a mock gator permissions storage entry
 *
 * @param amount - The amount of mock gator permissions storage entries to create.
 * @param mockStorageEntry - The mock gator permissions storage entry to create.
 * @returns Mock gator permissions storage entry
 */
function createMockGatorPermissionsStorageEntries(
  amount: number,
  mockStorageEntry: StoredGatorPermission<AccountSigner, PermissionTypes>,
): StoredGatorPermission<AccountSigner, PermissionTypes>[] {
  return Array.from(
    { length: amount },
    (_, index: number) =>
      ({
        ...mockStorageEntry,
        expiry: mockStorageEntry.permissionResponse.expiry + index,
      } as StoredGatorPermission<AccountSigner, PermissionTypes>),
  );
}

/**
 * Creates a mock gator permissions list
 *
 * @param config - The config for the mock gator permissions storage entries.
 * @returns Mock gator permissions list
 */
function mockGatorPermissionsStorageEntriesFactory(
  config: MockGatorPermissionsStorageEntriesConfig,
): GatorPermissionsList {
  const mockGatorPermissionsList: GatorPermissionsList = {
    'native-token-stream': {
      [MOCK_CHAIN_ID_MAINNET]: [],
      [MOCK_CHAIN_ID_POLYGON]: [],
    },
    'native-token-periodic': {
      [MOCK_CHAIN_ID_MAINNET]: [],
      [MOCK_CHAIN_ID_POLYGON]: [],
    },
    'erc20-token-stream': {
      [MOCK_CHAIN_ID_MAINNET]: [],
      [MOCK_CHAIN_ID_POLYGON]: [],
    },
  };

  // Create entries for each chainId
  Object.entries(config).forEach(([chainId, options]) => {
    const mockNativeTokenStreamStorageEntry: StoredGatorPermission<
      AccountSigner,
      NativeTokenStreamPermission
    > = {
      permissionResponse: {
        chainId: chainId as Hex,
        address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
        expiry: 1750291200,
        isAdjustmentAllowed: true,
        signer: {
          type: 'account',
          data: { address: '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63' },
        },
        permission: {
          type: 'native-token-stream',
          data: {
            maxAmount: '0x22b1c8c1227a0000',
            initialAmount: '0x6f05b59d3b20000',
            amountPerSecond: '0x6f05b59d3b20000',
            startTime: 1747699200,
            justification:
              'This is a very important request for streaming allowance for some very important thing',
          },
          rules: {},
        },
        context: '0x00000000',
        accountMeta: [
          {
            factory: '0x69Aa2f9fe1572F1B640E1bbc512f5c3a734fc77c',
            factoryData: '0x0000000',
          },
        ],
        signerMeta: {
          delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
        },
      },
      siteOrigin: options.siteOrigin,
    };

    const mockNativeTokenPeriodicStorageEntry: StoredGatorPermission<
      AccountSigner,
      NativeTokenPeriodicPermission
    > = {
      permissionResponse: {
        chainId: chainId as Hex,
        address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
        expiry: 1750291200,
        isAdjustmentAllowed: true,
        signer: {
          type: 'account',
          data: { address: '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63' },
        },
        permission: {
          type: 'native-token-periodic',
          data: {
            periodAmount: '0x22b1c8c1227a0000',
            periodDuration: 1747699200,
            startTime: 1747699200,
            justification:
              'This is a very important request for streaming allowance for some very important thing',
          },
          rules: {},
        },
        context: '0x00000000',
        accountMeta: [
          {
            factory: '0x69Aa2f9fe1572F1B640E1bbc512f5c3a734fc77c',
            factoryData: '0x0000000',
          },
        ],
        signerMeta: {
          delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
        },
      },
      siteOrigin: options.siteOrigin,
    };

    const mockErc20TokenStreamStorageEntry: StoredGatorPermission<
      AccountSigner,
      Erc20TokenStreamPermission
    > = {
      permissionResponse: {
        chainId: chainId as Hex,
        address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
        expiry: 1750291200,
        isAdjustmentAllowed: true,
        signer: {
          type: 'account',
          data: { address: '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63' },
        },
        permission: {
          type: 'erc20-token-stream',
          data: {
            initialAmount: '0x22b1c8c1227a0000',
            maxAmount: '0x6f05b59d3b20000',
            amountPerSecond: '0x6f05b59d3b20000',
            startTime: 1747699200,
            tokenAddress: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
            justification:
              'This is a very important request for streaming allowance for some very important thing',
          },
          rules: {},
        },
        context: '0x00000000',
        accountMeta: [
          {
            factory: '0x69Aa2f9fe1572F1B640E1bbc512f5c3a734fc77c',
            factoryData: '0x0000000',
          },
        ],
        signerMeta: {
          delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
        },
      },
      siteOrigin: options.siteOrigin,
    };

    mockGatorPermissionsList['native-token-stream'][chainId] =
      createMockGatorPermissionsStorageEntries(
        options.nativeTokenStream,
        mockNativeTokenStreamStorageEntry,
      );

    mockGatorPermissionsList['native-token-periodic'][chainId] =
      createMockGatorPermissionsStorageEntries(
        options.nativeTokenPeriodic,
        mockNativeTokenPeriodicStorageEntry,
      );

    mockGatorPermissionsList['erc20-token-stream'][chainId] =
      createMockGatorPermissionsStorageEntries(
        options.erc20TokenStream,
        mockErc20TokenStreamStorageEntry,
      );
  });

  return mockGatorPermissionsList;
}

describe('Gator Permissions Selectors', () => {
  const mockGatorPermissionsList = mockGatorPermissionsStorageEntriesFactory({
    [MOCK_CHAIN_ID_MAINNET]: {
      nativeTokenStream: 1,
      nativeTokenPeriodic: 1,
      erc20TokenStream: 1,
      siteOrigin: 'http://localhost:8000',
    },
    [MOCK_CHAIN_ID_POLYGON]: {
      nativeTokenStream: 1,
      nativeTokenPeriodic: 1,
      erc20TokenStream: 1,
      siteOrigin: 'http://localhost:8001',
    },
  });
  const mockState = {
    metamask: {
      gatorPermissionsListStringify: JSON.stringify(mockGatorPermissionsList),
      isGatorPermissionsEnabled: true,
      isFetchingGatorPermissions: false,
      isUpdatingGatorPermissions: false,
    },
  };

  describe('gatorPermissionsListStringify', () => {
    it('should select the gatorPermissionsListStringify state', () => {
      expect(getGatorPermissionsList(mockState)).toEqual(
        mockGatorPermissionsList,
      );
    });
  });

  describe('getGatorPermissionByPermissionTypeAndChainId', () => {
    it('should select the gatorPermissionByPermissionTypeAndChainId state for a native token stream on a given chainId', () => {
      expect(
        getGatorPermissionByPermissionTypeAndChainId(
          mockState,
          'native-token-stream',
          MOCK_CHAIN_ID_MAINNET,
        ),
      ).toEqual(
        mockGatorPermissionsList['native-token-stream'][MOCK_CHAIN_ID_MAINNET],
      );
    });

    it('should return an empty array if no gator permissions are found for a given permission type and chainId', () => {
      expect(
        getGatorPermissionByPermissionTypeAndChainId(
          mockState,
          'native-token-stream',
          '0x1111111111111111111111111111111111111111',
        ),
      ).toEqual([]);
    });
  });

  describe('getGatorAssetListDetail', () => {
    it('should select the gatorAssetListDetail state for token-streams list type', () => {
      expect(getGatorAssetListDetail(mockState, 'token-streams')).toEqual({
        [MOCK_CHAIN_ID_MAINNET]: {
          total: 2,
          description: 'streaming permissions',
        },
        [MOCK_CHAIN_ID_POLYGON]: {
          total: 2,
          description: 'streaming permissions',
        },
      });
    });

    it('should select the gatorAssetListDetail state for token-subscriptions list type', () => {
      expect(getGatorAssetListDetail(mockState, 'token-subscriptions')).toEqual({
        [MOCK_CHAIN_ID_MAINNET]: {
          total: 1,
          description: 'subscription permissions',
        },
        [MOCK_CHAIN_ID_POLYGON]: {
          total: 1,
          description: 'subscription permissions',
        },
      });
    });

    it('should return an empty object if no gator permissions are found for a given list type', () => {
      expect(getGatorAssetListDetail(mockState, 'not-a-list-type')).toEqual({});
    });

    it('should return asset list with undefined description for unknown list type with permissions', () => {
      const customState = {
        metamask: {
          gatorPermissionsListStringify: JSON.stringify({
            'custom-type': {
              '0x1': [
                {
                  permissionResponse: {
                    chainId: '0x1',
                    address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                    expiry: 1750291200,
                    isAdjustmentAllowed: true,
                    signer: {
                      type: 'account',
                      data: { address: '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63' },
                    },
                    permission: {
                      type: 'custom-type',
                      data: {},
                      rules: {},
                    },
                    context: '0x00000000',
                    accountMeta: [],
                    signerMeta: {},
                  },
                  siteOrigin: 'http://localhost:8000',
                },
              ],
            },
          }),
          isGatorPermissionsEnabled: true,
          isFetchingGatorPermissions: false,
          isUpdatingGatorPermissions: false,
        },
      };
      const result = getGatorAssetListDetail(customState, 'custom-type');
      expect(result).toEqual({});
    });

    it('should handle missing description in custom descriptionLookup', () => {
      const stateWithStreamPermissions = {
        metamask: {
          gatorPermissionsListStringify: JSON.stringify({
            'native-token-stream': {
              '0x1': [
                {
                  permissionResponse: {
                    chainId: '0x1',
                    address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                    expiry: 1750291200,
                    isAdjustmentAllowed: true,
                    signer: {
                      type: 'account',
                      data: { address: '0x4f71DA06987BfeDE90aF0b33E1e3e4ffDCEE7a63' },
                    },
                    permission: {
                      type: 'native-token-stream',
                      data: {},
                      rules: {},
                    },
                    context: '0x00000000',
                    accountMeta: [],
                    signerMeta: {},
                  },
                  siteOrigin: 'http://localhost:8000',
                },
              ],
            },
            'erc20-token-stream': {
              '0x1': [],
            },
          }),
          isGatorPermissionsEnabled: true,
          isFetchingGatorPermissions: false,
          isUpdatingGatorPermissions: false,
        },
      };

      const customDescriptionLookup = {
        'token-subscriptions': 'subscription permissions',
      };

      const result = getGatorAssetListDetail(
        stateWithStreamPermissions,
        'token-streams',
        customDescriptionLookup,
      );

      expect(result).toEqual({
        '0x1': {
          total: 1,
          description: 'No description',
        },
      });
    });
  });
});
