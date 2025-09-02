import type {
  GatorPermissionsMap,
  Erc20TokenStreamPermission,
  NativeTokenPeriodicPermission,
  NativeTokenStreamPermission,
  PermissionTypes,
  StoredGatorPermissionSanitized,
  SignerParam,
} from '@metamask/gator-permissions-controller';
import { Hex } from '@metamask/utils';
import {
  getGatorPermissionsMap,
  getGatorPermissionByPermissionTypeAndChainId,
  getGatorAssetListDetail,
  getAggregatedGatorPermissionByChainId,
  getAggregatedTokenTransferPermissionsByChainId,
  getFilteredGatorPermissionsByType,
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
function createMockGatorPermissionsSanitizedEntries(
  amount: number,
  mockStorageEntry: StoredGatorPermissionSanitized<
    SignerParam,
    PermissionTypes
  >,
): StoredGatorPermissionSanitized<SignerParam, PermissionTypes>[] {
  return Array.from(
    { length: amount },
    (_, index: number) =>
      ({
        ...mockStorageEntry,
        expiry: mockStorageEntry.permissionResponse.expiry + index,
      }) as StoredGatorPermissionSanitized<SignerParam, PermissionTypes>,
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
): GatorPermissionsMap {
  const mockGatorPermissionsMap: GatorPermissionsMap = {
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
    'erc20-token-periodic': {
      [MOCK_CHAIN_ID_MAINNET]: [],
      [MOCK_CHAIN_ID_POLYGON]: [],
    },
    other: {
      [MOCK_CHAIN_ID_MAINNET]: [
        {
          permissionResponse: {
            chainId: MOCK_CHAIN_ID_MAINNET as Hex,
            address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
            expiry: 1750291200,
            permission: {
              type: 'custom',
              data: {
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
                customData: `custom data on chain ${MOCK_CHAIN_ID_MAINNET}`,
              },
              rules: {},
            },
            context: '0x00000000',
            signerMeta: {
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
          },
          siteOrigin: 'http://localhost:8000',
        },
      ],
      [MOCK_CHAIN_ID_POLYGON]: [
        {
          permissionResponse: {
            chainId: MOCK_CHAIN_ID_POLYGON,
            address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
            expiry: 1750291200,
            permission: {
              type: 'custom',
              data: {
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
                customData: `custom data on chain ${MOCK_CHAIN_ID_POLYGON}`,
              },
              rules: {},
            },
            context: '0x00000000',
            signerMeta: {
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
          },
          siteOrigin: 'http://localhost:8000',
        },
      ],
    },
  };

  // Create entries for each chainId
  Object.entries(config).forEach(([chainId, options]) => {
    const mockNativeTokenStreamStorageEntry: StoredGatorPermissionSanitized<
      SignerParam,
      NativeTokenStreamPermission
    > = {
      permissionResponse: {
        chainId: chainId as Hex,
        address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
        expiry: 1750291200,
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
        signerMeta: {
          delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
        },
      },
      siteOrigin: options.siteOrigin,
    };

    const mockNativeTokenPeriodicStorageEntry: StoredGatorPermissionSanitized<
      SignerParam,
      NativeTokenPeriodicPermission
    > = {
      permissionResponse: {
        chainId: chainId as Hex,
        address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
        expiry: 1750291200,
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
        signerMeta: {
          delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
        },
      },
      siteOrigin: options.siteOrigin,
    };

    const mockErc20TokenStreamStorageEntry: StoredGatorPermissionSanitized<
      SignerParam,
      Erc20TokenStreamPermission
    > = {
      permissionResponse: {
        chainId: chainId as Hex,
        address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
        expiry: 1750291200,
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
        signerMeta: {
          delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
        },
      },
      siteOrigin: options.siteOrigin,
    };

    mockGatorPermissionsMap['native-token-stream'][chainId as Hex] =
      createMockGatorPermissionsSanitizedEntries(
        options.nativeTokenStream,
        mockNativeTokenStreamStorageEntry,
      ) as StoredGatorPermissionSanitized<
        SignerParam,
        NativeTokenStreamPermission
      >[];

    mockGatorPermissionsMap['native-token-periodic'][chainId as Hex] =
      createMockGatorPermissionsSanitizedEntries(
        options.nativeTokenPeriodic,
        mockNativeTokenPeriodicStorageEntry,
      ) as StoredGatorPermissionSanitized<
        SignerParam,
        NativeTokenPeriodicPermission
      >[];

    mockGatorPermissionsMap['erc20-token-stream'][chainId as Hex] =
      createMockGatorPermissionsSanitizedEntries(
        options.erc20TokenStream,
        mockErc20TokenStreamStorageEntry,
      ) as StoredGatorPermissionSanitized<
        SignerParam,
        Erc20TokenStreamPermission
      >[];
  });

  return mockGatorPermissionsMap;
}

describe('Gator Permissions Selectors', () => {
  const mockGatorPermissionsMap = mockGatorPermissionsStorageEntriesFactory({
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
      gatorPermissionsMapSerialized: JSON.stringify(mockGatorPermissionsMap),
      isGatorPermissionsEnabled: true,
      isFetchingGatorPermissions: false,
      isUpdatingGatorPermissions: false,
    },
  };

  describe('gatorPermissionsMapSerialized', () => {
    it('should select the gatorPermissionsMapSerialized state', () => {
      expect(getGatorPermissionsMap(mockState)).toEqual(
        mockGatorPermissionsMap,
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
        mockGatorPermissionsMap['native-token-stream'][MOCK_CHAIN_ID_MAINNET],
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
      expect(getGatorAssetListDetail(mockState, 'token-subscriptions')).toEqual(
        {
          [MOCK_CHAIN_ID_MAINNET]: {
            total: 1,
            description: 'subscription permissions',
          },
          [MOCK_CHAIN_ID_POLYGON]: {
            total: 1,
            description: 'subscription permissions',
          },
        },
      );
    });

    it('should select the gatorAssetListDetail state for other list type', () => {
      expect(getGatorAssetListDetail(mockState, 'other')).toEqual({
        [MOCK_CHAIN_ID_MAINNET]: {
          total: 1,
          description: 'custom permissions',
        },
        [MOCK_CHAIN_ID_POLYGON]: {
          total: 1,
          description: 'custom permissions',
        },
      });
    });

    it('should return an empty object if no gator permissions are found for a given list type', () => {
      expect(getGatorAssetListDetail(mockState, 'not-a-list-type')).toEqual({});
    });

    it('should handle missing description in custom descriptionLookup', () => {
      const result = getGatorAssetListDetail(mockState, 'other', {
        'token-streams': 'streaming permissions',
        'token-subscriptions': 'subscription permissions',
        other: undefined as unknown as string,
      });

      expect(result).toEqual({
        [MOCK_CHAIN_ID_MAINNET]: {
          total: 1,
          description: 'No description',
        },
        [MOCK_CHAIN_ID_POLYGON]: {
          total: 1,
          description: 'No description',
        },
      });
    });

    it('should handle overlapping chainIds in mergeRecords function', () => {
      const mockStateWithOverlappingChains = {
        metamask: {
          gatorPermissionsMapSerialized: JSON.stringify({
            'native-token-stream': {
              [MOCK_CHAIN_ID_MAINNET]: [
                {
                  permissionResponse: {
                    chainId: MOCK_CHAIN_ID_MAINNET as Hex,
                    address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                    expiry: 1750291200,
                    permission: {
                      type: 'native-token-stream',
                      data: {
                        maxAmount: '0x22b1c8c1227a0000',
                        initialAmount: '0x6f05b59d3b20000',
                        amountPerSecond: '0x6f05b59d3b20000',
                        startTime: 1747699200,
                        justification: 'Test justification',
                      },
                      rules: {},
                    },
                    context: '0x00000000',
                    signerMeta: {
                      delegationManager:
                        '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
                    },
                  },
                  siteOrigin: 'http://localhost:8000',
                },
              ],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
            'erc20-token-stream': {
              [MOCK_CHAIN_ID_MAINNET]: [
                {
                  permissionResponse: {
                    chainId: MOCK_CHAIN_ID_MAINNET as Hex,
                    address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                    expiry: 1750291200,
                    permission: {
                      type: 'erc20-token-stream',
                      data: {
                        initialAmount: '0x22b1c8c1227a0000',
                        maxAmount: '0x6f05b59d3b20000',
                        amountPerSecond: '0x6f05b59d3b20000',
                        startTime: 1747699200,
                        tokenAddress:
                          '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                        justification: 'Test justification',
                      },
                      rules: {},
                    },
                    context: '0x00000000',
                    signerMeta: {
                      delegationManager:
                        '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
                    },
                  },
                  siteOrigin: 'http://localhost:8000',
                },
              ],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
            'native-token-periodic': {
              [MOCK_CHAIN_ID_MAINNET]: [],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
            'erc20-token-periodic': {
              [MOCK_CHAIN_ID_MAINNET]: [],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
            other: {
              [MOCK_CHAIN_ID_MAINNET]: [],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
          }),
          isGatorPermissionsEnabled: true,
          isFetchingGatorPermissions: false,
          isUpdatingGatorPermissions: false,
        },
      };

      const result = getGatorAssetListDetail(
        mockStateWithOverlappingChains,
        'token-streams',
      );

      expect(result).toEqual({
        [MOCK_CHAIN_ID_MAINNET]: {
          total: 2,
          description: 'streaming permissions',
        },
      });
    });

    it('should handle different chainIds in mergeRecords function', () => {
      const mockStateWithDifferentChains = {
        metamask: {
          gatorPermissionsMapSerialized: JSON.stringify({
            'native-token-stream': {
              [MOCK_CHAIN_ID_MAINNET]: [
                {
                  permissionResponse: {
                    chainId: MOCK_CHAIN_ID_MAINNET as Hex,
                    address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                    expiry: 1750291200,
                    permission: {
                      type: 'native-token-stream',
                      data: {
                        maxAmount: '0x22b1c8c1227a0000',
                        initialAmount: '0x6f05b59d3b20000',
                        amountPerSecond: '0x6f05b59d3b20000',
                        startTime: 1747699200,
                        justification: 'Test justification',
                      },
                      rules: {},
                    },
                    context: '0x00000000',
                    signerMeta: {
                      delegationManager:
                        '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
                    },
                  },
                  siteOrigin: 'http://localhost:8000',
                },
              ],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
            'erc20-token-stream': {
              [MOCK_CHAIN_ID_MAINNET]: [],
              [MOCK_CHAIN_ID_POLYGON]: [
                {
                  permissionResponse: {
                    chainId: MOCK_CHAIN_ID_POLYGON as Hex,
                    address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                    expiry: 1750291200,
                    permission: {
                      type: 'erc20-token-stream',
                      data: {
                        initialAmount: '0x22b1c8c1227a0000',
                        maxAmount: '0x6f05b59d3b20000',
                        amountPerSecond: '0x6f05b59d3b20000',
                        startTime: 1747699200,
                        tokenAddress:
                          '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                        justification: 'Test justification',
                      },
                      rules: {},
                    },
                    context: '0x00000000',
                    signerMeta: {
                      delegationManager:
                        '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
                    },
                  },
                  siteOrigin: 'http://localhost:8000',
                },
              ],
            },
            'native-token-periodic': {
              [MOCK_CHAIN_ID_MAINNET]: [],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
            'erc20-token-periodic': {
              [MOCK_CHAIN_ID_MAINNET]: [],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
            other: {
              [MOCK_CHAIN_ID_MAINNET]: [],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
          }),
          isGatorPermissionsEnabled: true,
          isFetchingGatorPermissions: false,
          isUpdatingGatorPermissions: false,
        },
      };

      const result = getGatorAssetListDetail(
        mockStateWithDifferentChains,
        'token-streams',
      );

      expect(result).toEqual({
        [MOCK_CHAIN_ID_MAINNET]: {
          total: 1,
          description: 'streaming permissions',
        },
        [MOCK_CHAIN_ID_POLYGON]: {
          total: 1,
          description: 'streaming permissions',
        },
      });
    });
  });

  describe('getAggregatedGatorPermissionByChainId', () => {
    it('should return aggregated token transfer permissions for a specific chain', () => {
      const result = getAggregatedGatorPermissionByChainId(
        mockState,
        'token-transfer',
        MOCK_CHAIN_ID_MAINNET,
      );

      expect(result).toHaveLength(3); // 1 native-token-stream + 1 native-token-periodic + 1 erc20-token-stream
      expect(result[0].permissionResponse.chainId).toBe(MOCK_CHAIN_ID_MAINNET);
      expect(result[1].permissionResponse.chainId).toBe(MOCK_CHAIN_ID_MAINNET);
      expect(result[2].permissionResponse.chainId).toBe(MOCK_CHAIN_ID_MAINNET);
    });

    it('should return empty array for unknown aggregated permission type', () => {
      const result = getAggregatedGatorPermissionByChainId(
        mockState,
        'unknown-type',
        MOCK_CHAIN_ID_MAINNET,
      );

      expect(result).toEqual([]);
    });

    it('should return empty array for chain with no permissions', () => {
      const result = getAggregatedGatorPermissionByChainId(
        mockState,
        'token-transfer',
        '0x1111111111111111111111111111111111111111' as Hex,
      );

      expect(result).toEqual([]);
    });
  });

  describe('getAggregatedTokenTransferPermissionsByChainId', () => {
    it('should return aggregated token transfer permissions for all chains', () => {
      const result = getAggregatedTokenTransferPermissionsByChainId(mockState);

      expect(result).toHaveProperty(MOCK_CHAIN_ID_MAINNET);
      expect(result).toHaveProperty(MOCK_CHAIN_ID_POLYGON);
      expect(result[MOCK_CHAIN_ID_MAINNET]).toHaveLength(3); // 1 native-token-stream + 1 native-token-periodic + 1 erc20-token-stream
      expect(result[MOCK_CHAIN_ID_POLYGON]).toHaveLength(3); // 1 native-token-stream + 1 native-token-periodic + 1 erc20-token-stream
    });

    it('should return empty object when no permissions exist', () => {
      const emptyState = {
        metamask: {
          gatorPermissionsMapSerialized: JSON.stringify({
            'native-token-stream': {},
            'native-token-periodic': {},
            'erc20-token-stream': {},
            'erc20-token-periodic': {},
            other: {},
          }),
          isGatorPermissionsEnabled: true,
          isFetchingGatorPermissions: false,
          isUpdatingGatorPermissions: false,
        },
      };

      const result = getAggregatedTokenTransferPermissionsByChainId(emptyState);

      expect(result).toEqual({});
    });
  });

  describe('getFilteredGatorPermissionsByType', () => {
    it('should return filtered permissions for a specific site origin', () => {
      const result = getFilteredGatorPermissionsByType(
        mockState,
        'http://localhost:8000',
      );

      expect(result.count).toBe(3); // 1 native-token-stream + 1 native-token-periodic + 1 erc20-token-stream
      expect(result.chains).toEqual([MOCK_CHAIN_ID_MAINNET]);
      expect(result.permissions).toHaveLength(3);
      expect(result.permissions[0].permission.siteOrigin).toBe('http://localhost:8000');
      expect(result.permissions[1].permission.siteOrigin).toBe('http://localhost:8000');
      expect(result.permissions[2].permission.siteOrigin).toBe('http://localhost:8000');
    });

    it('should return empty result for site origin with no permissions', () => {
      const result = getFilteredGatorPermissionsByType(
        mockState,
        'http://nonexistent.com',
      );

      expect(result.count).toBe(0);
      expect(result.chains).toEqual([]);
      expect(result.permissions).toEqual([]);
    });

    it('should handle case-insensitive site origin matching', () => {
      const result = getFilteredGatorPermissionsByType(
        mockState,
        'HTTP://LOCALHOST:8000',
      );

      expect(result.count).toBe(3);
      expect(result.chains).toEqual([MOCK_CHAIN_ID_MAINNET]);
      expect(result.permissions).toHaveLength(3);
    });

    it('should aggregate permissions from multiple chains for the same site', () => {
      const multiChainState = {
        metamask: {
          gatorPermissionsMapSerialized: JSON.stringify({
            'native-token-stream': {
              [MOCK_CHAIN_ID_MAINNET]: [
                {
                  permissionResponse: {
                    chainId: MOCK_CHAIN_ID_MAINNET as Hex,
                    address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                    expiry: 1750291200,
                    permission: {
                      type: 'native-token-stream',
                      data: {
                        maxAmount: '0x22b1c8c1227a0000',
                        initialAmount: '0x6f05b59d3b20000',
                        amountPerSecond: '0x6f05b59d3b20000',
                        startTime: 1747699200,
                        justification: 'Test justification',
                      },
                      rules: {},
                    },
                    context: '0x00000000',
                    signerMeta: {
                      delegationManager:
                        '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
                    },
                  },
                  siteOrigin: 'http://localhost:8000',
                },
              ],
              [MOCK_CHAIN_ID_POLYGON]: [
                {
                  permissionResponse: {
                    chainId: MOCK_CHAIN_ID_POLYGON as Hex,
                    address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                    expiry: 1750291200,
                    permission: {
                      type: 'native-token-stream',
                      data: {
                        maxAmount: '0x22b1c8c1227a0000',
                        initialAmount: '0x6f05b59d3b20000',
                        amountPerSecond: '0x6f05b59d3b20000',
                        startTime: 1747699200,
                        justification: 'Test justification',
                      },
                      rules: {},
                    },
                    context: '0x00000000',
                    signerMeta: {
                      delegationManager:
                        '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
                    },
                  },
                  siteOrigin: 'http://localhost:8000',
                },
              ],
            },
            'native-token-periodic': {
              [MOCK_CHAIN_ID_MAINNET]: [],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
            'erc20-token-stream': {
              [MOCK_CHAIN_ID_MAINNET]: [],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
            'erc20-token-periodic': {
              [MOCK_CHAIN_ID_MAINNET]: [],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
            other: {
              [MOCK_CHAIN_ID_MAINNET]: [],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
          }),
          isGatorPermissionsEnabled: true,
          isFetchingGatorPermissions: false,
          isUpdatingGatorPermissions: false,
        },
      };

      const result = getFilteredGatorPermissionsByType(
        multiChainState,
        'http://localhost:8000',
      );

      expect(result.count).toBe(2);
      expect(result.chains).toEqual([
        MOCK_CHAIN_ID_MAINNET,
        MOCK_CHAIN_ID_POLYGON,
      ]);
      expect(result.permissions).toHaveLength(2);
    });
  });
});
