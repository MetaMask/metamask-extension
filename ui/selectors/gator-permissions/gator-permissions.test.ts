import type {
  GatorPermissionsMap,
  Erc20TokenStreamPermission,
  NativeTokenPeriodicPermission,
  NativeTokenStreamPermission,
  PermissionTypesWithCustom,
  StoredGatorPermissionSanitized,
  Signer,
} from '@metamask/gator-permissions-controller';
import { Hex } from '@metamask/utils';
import { SnapId } from '@metamask/snaps-sdk';
import {
  getGatorPermissionsMap,
  getAggregatedGatorPermissionsCountAcrossAllChains,
  getPermissionGroupMetaData,
  getPermissionMetaDataByOrigin,
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
    Signer,
    PermissionTypesWithCustom
  >,
): StoredGatorPermissionSanitized<Signer, PermissionTypesWithCustom>[] {
  return Array.from(
    { length: amount },
    (_, _index: number) =>
      ({
        ...mockStorageEntry,
      }) as StoredGatorPermissionSanitized<Signer, PermissionTypesWithCustom>,
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
            permission: {
              type: 'custom',
              isAdjustmentAllowed: false,
              data: {
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
                customData: `custom data on chain ${MOCK_CHAIN_ID_MAINNET}`,
              },
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
            permission: {
              type: 'custom',
              isAdjustmentAllowed: false,
              data: {
                justification:
                  'This is a very important request for streaming allowance for some very important thing',
                customData: `custom data on chain ${MOCK_CHAIN_ID_POLYGON}`,
              },
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
      Signer,
      NativeTokenStreamPermission
    > = {
      permissionResponse: {
        chainId: chainId as Hex,
        address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
        permission: {
          type: 'native-token-stream',
          isAdjustmentAllowed: false,
          data: {
            maxAmount: '0x22b1c8c1227a0000',
            initialAmount: '0x6f05b59d3b20000',
            amountPerSecond: '0x6f05b59d3b20000',
            startTime: 1747699200,
            justification:
              'This is a very important request for streaming allowance for some very important thing',
          },
        },
        context: '0x00000000',
        signerMeta: {
          delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
        },
      },
      siteOrigin: options.siteOrigin,
    };

    const mockNativeTokenPeriodicStorageEntry: StoredGatorPermissionSanitized<
      Signer,
      NativeTokenPeriodicPermission
    > = {
      permissionResponse: {
        chainId: chainId as Hex,
        address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
        permission: {
          type: 'native-token-periodic',
          isAdjustmentAllowed: false,
          data: {
            periodAmount: '0x22b1c8c1227a0000',
            periodDuration: 1747699200,
            startTime: 1747699200,
            justification:
              'This is a very important request for streaming allowance for some very important thing',
          },
        },
        context: '0x00000000',
        signerMeta: {
          delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
        },
      },
      siteOrigin: options.siteOrigin,
    };

    const mockErc20TokenStreamStorageEntry: StoredGatorPermissionSanitized<
      Signer,
      Erc20TokenStreamPermission
    > = {
      permissionResponse: {
        chainId: chainId as Hex,
        address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
        permission: {
          type: 'erc20-token-stream',
          isAdjustmentAllowed: false,
          data: {
            initialAmount: '0x22b1c8c1227a0000',
            maxAmount: '0x6f05b59d3b20000',
            amountPerSecond: '0x6f05b59d3b20000',
            startTime: 1747699200,
            tokenAddress: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
            justification:
              'This is a very important request for streaming allowance for some very important thing',
          },
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
        Signer,
        NativeTokenStreamPermission
      >[];

    mockGatorPermissionsMap['native-token-periodic'][chainId as Hex] =
      createMockGatorPermissionsSanitizedEntries(
        options.nativeTokenPeriodic,
        mockNativeTokenPeriodicStorageEntry,
      ) as StoredGatorPermissionSanitized<
        Signer,
        NativeTokenPeriodicPermission
      >[];

    mockGatorPermissionsMap['erc20-token-stream'][chainId as Hex] =
      createMockGatorPermissionsSanitizedEntries(
        options.erc20TokenStream,
        mockErc20TokenStreamStorageEntry,
      ) as StoredGatorPermissionSanitized<Signer, Erc20TokenStreamPermission>[];
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
      gatorPermissionsProviderSnapId: 'local:http://localhost:8080/' as SnapId,
    },
  };

  describe('gatorPermissionsMapSerialized', () => {
    it('should select the gatorPermissionsMapSerialized state', () => {
      expect(getGatorPermissionsMap(mockState)).toEqual(
        mockGatorPermissionsMap,
      );
    });
  });

  describe('getAggregatedGatorPermissionsCountAcrossAllChains', () => {
    describe('token-transfer aggregated permission type', () => {
      it('should return the correct count for token-transfer with all permission types', () => {
        const result = getAggregatedGatorPermissionsCountAcrossAllChains(
          mockState,
          'token-transfer',
        );
        // we have 2 chains for mock data in  state (mainnet + polygon), so: (1+1) + (1+1) + (1+1) + (0+0) = 6
        expect(result).toBe(6);
      });

      it('should return 0 when no permissions exist', () => {
        const emptyState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify({
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
                [MOCK_CHAIN_ID_MAINNET]: [],
                [MOCK_CHAIN_ID_POLYGON]: [],
              },
            }),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        const result = getAggregatedGatorPermissionsCountAcrossAllChains(
          emptyState,
          'token-transfer',
        );
        expect(result).toBe(0);
      });

      it('should handle different counts across chains correctly', () => {
        const customMockGatorPermissionsMap =
          mockGatorPermissionsStorageEntriesFactory({
            [MOCK_CHAIN_ID_MAINNET]: {
              nativeTokenStream: 2,
              nativeTokenPeriodic: 1,
              erc20TokenStream: 3,
              siteOrigin: 'http://localhost:8000',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              nativeTokenStream: 1,
              nativeTokenPeriodic: 2,
              erc20TokenStream: 0,
              siteOrigin: 'http://localhost:8001',
            },
          });

        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              customMockGatorPermissionsMap,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        const result = getAggregatedGatorPermissionsCountAcrossAllChains(
          customState,
          'token-transfer',
        );
        expect(result).toBe(9);
      });
    });

    describe('unknown aggregated permission type', () => {
      it('should return 0 for unknown permission type', () => {
        const result = getAggregatedGatorPermissionsCountAcrossAllChains(
          mockState,
          'unknown-permission-type',
        );

        expect(result).toBe(0);
      });

      it('should return 0 for empty string permission type', () => {
        const result = getAggregatedGatorPermissionsCountAcrossAllChains(
          mockState,
          '',
        );

        expect(result).toBe(0);
      });
    });

    describe('undefined values handling', () => {
      it('should throw error when undefined values are present in native-token-stream permissions', () => {
        const mockGatorPermissionsMapWithUndefined = {
          'native-token-stream': {
            [MOCK_CHAIN_ID_MAINNET]: [undefined, { permissionResponse: {} }],
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
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
        };

        const stateWithUndefined = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsMapWithUndefined,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        expect(() => {
          getAggregatedGatorPermissionsCountAcrossAllChains(
            stateWithUndefined,
            'token-transfer',
          );
        }).toThrow(
          'Undefined values present in the gatorPermissionsMap for permission type: native-token-stream',
        );
      });

      it('should throw error when undefined values are present in erc20-token-stream permissions', () => {
        const mockGatorPermissionsMapWithUndefined = {
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
            [MOCK_CHAIN_ID_POLYGON]: [undefined, { permissionResponse: {} }],
          },
          'erc20-token-periodic': {
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
          other: {
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
        };

        const stateWithUndefined = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsMapWithUndefined,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        expect(() => {
          getAggregatedGatorPermissionsCountAcrossAllChains(
            stateWithUndefined,
            'token-transfer',
          );
        }).toThrow(
          'Undefined values present in the gatorPermissionsMap for permission type: erc20-token-stream',
        );
      });

      it('should throw error when undefined values are present in native-token-periodic permissions', () => {
        const mockGatorPermissionsMapWithUndefined = {
          'native-token-stream': {
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
          'native-token-periodic': {
            [MOCK_CHAIN_ID_MAINNET]: [undefined, { permissionResponse: {} }],
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
        };

        const stateWithUndefined = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsMapWithUndefined,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        expect(() => {
          getAggregatedGatorPermissionsCountAcrossAllChains(
            stateWithUndefined,
            'token-transfer',
          );
        }).toThrow(
          'Undefined values present in the gatorPermissionsMap for permission type: native-token-periodic',
        );
      });

      it('should throw error when undefined values are present in erc20-token-periodic permissions', () => {
        const mockGatorPermissionsMapWithUndefined = {
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
            [MOCK_CHAIN_ID_POLYGON]: [undefined, { permissionResponse: {} }],
          },
          other: {
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
        };

        const stateWithUndefined = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsMapWithUndefined,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        expect(() => {
          getAggregatedGatorPermissionsCountAcrossAllChains(
            stateWithUndefined,
            'token-transfer',
          );
        }).toThrow(
          'Undefined values present in the gatorPermissionsMap for permission type: erc20-token-periodic',
        );
      });

      it('should not throw error when no undefined values are present', () => {
        // This test verifies the happy path where no undefined values exist
        const result = getAggregatedGatorPermissionsCountAcrossAllChains(
          mockState,
          'token-transfer',
        );
        expect(result).toBe(6);
      });
    });
  });

  describe('getPermissionGroupMetaData', () => {
    describe('token-transfer permission group', () => {
      it('should return correct permission group details for token-transfer with all permission types', () => {
        const result = getPermissionGroupMetaData(mockState, 'token-transfer');

        // Expected: 2 chains, each with 3 permissions (1 native-token-stream + 1 native-token-periodic + 1 erc20-token-stream)
        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 3,
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            count: 3,
          },
        ]);
      });

      it('should return empty array when no permissions exist', () => {
        const emptyState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify({
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
                [MOCK_CHAIN_ID_MAINNET]: [],
                [MOCK_CHAIN_ID_POLYGON]: [],
              },
            }),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        const result = getPermissionGroupMetaData(emptyState, 'token-transfer');
        expect(result).toEqual([]);
      });

      it('should handle different counts across chains correctly', () => {
        const customMockGatorPermissionsMap =
          mockGatorPermissionsStorageEntriesFactory({
            [MOCK_CHAIN_ID_MAINNET]: {
              nativeTokenStream: 2,
              nativeTokenPeriodic: 1,
              erc20TokenStream: 3,
              siteOrigin: 'http://localhost:8000',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              nativeTokenStream: 1,
              nativeTokenPeriodic: 2,
              erc20TokenStream: 0,
              siteOrigin: 'http://localhost:8001',
            },
          });

        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              customMockGatorPermissionsMap,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        const result = getPermissionGroupMetaData(
          customState,
          'token-transfer',
        );

        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 6,
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            count: 3,
          },
        ]);
      });

      it('should handle only native token permissions', () => {
        const nativeOnlyMockGatorPermissionsMap =
          mockGatorPermissionsStorageEntriesFactory({
            [MOCK_CHAIN_ID_MAINNET]: {
              nativeTokenStream: 2,
              nativeTokenPeriodic: 1,
              erc20TokenStream: 0,
              siteOrigin: 'http://localhost:8000',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              nativeTokenStream: 0,
              nativeTokenPeriodic: 3,
              erc20TokenStream: 0,
              siteOrigin: 'http://localhost:8001',
            },
          });

        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              nativeOnlyMockGatorPermissionsMap,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        const result = getPermissionGroupMetaData(
          customState,
          'token-transfer',
        );

        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 3,
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            count: 3,
          },
        ]);
      });

      it('should handle only ERC20 token permissions', () => {
        const erc20OnlyMockGatorPermissionsMap =
          mockGatorPermissionsStorageEntriesFactory({
            [MOCK_CHAIN_ID_MAINNET]: {
              nativeTokenStream: 0,
              nativeTokenPeriodic: 0,
              erc20TokenStream: 4,
              siteOrigin: 'http://localhost:8000',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              nativeTokenStream: 0,
              nativeTokenPeriodic: 0,
              erc20TokenStream: 2,
              siteOrigin: 'http://localhost:8001',
            },
          });

        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              erc20OnlyMockGatorPermissionsMap,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        const result = getPermissionGroupMetaData(
          customState,
          'token-transfer',
        );

        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 4,
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            count: 2,
          },
        ]);
      });

      it('should handle mixed permission types with different counts', () => {
        const mixedMockGatorPermissionsMap =
          mockGatorPermissionsStorageEntriesFactory({
            [MOCK_CHAIN_ID_MAINNET]: {
              nativeTokenStream: 1,
              nativeTokenPeriodic: 0,
              erc20TokenStream: 2,
              siteOrigin: 'http://localhost:8000',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              nativeTokenStream: 0,
              nativeTokenPeriodic: 2,
              erc20TokenStream: 1,
              siteOrigin: 'http://localhost:8001',
            },
          });

        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mixedMockGatorPermissionsMap,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        const result = getPermissionGroupMetaData(
          customState,
          'token-transfer',
        );

        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 3,
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            count: 3,
          },
        ]);
      });
    });

    describe('unknown permission group names', () => {
      it('should return empty array for permission group that are not supported', () => {
        const result = getPermissionGroupMetaData(
          mockState,
          'unknown-permission-group',
        );
        expect(result).toEqual([]);
      });
    });

    describe('edge cases', () => {
      it('should handle single chain with permissions', () => {
        const singleChainMockGatorPermissionsMap =
          mockGatorPermissionsStorageEntriesFactory({
            [MOCK_CHAIN_ID_MAINNET]: {
              nativeTokenStream: 2,
              nativeTokenPeriodic: 1,
              erc20TokenStream: 1,
              siteOrigin: 'http://localhost:8000',
            },
          });

        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              singleChainMockGatorPermissionsMap,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        const result = getPermissionGroupMetaData(
          customState,
          'token-transfer',
        );

        // Expected: Mainnet: 2 + 1 + 1 = 4
        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 4,
          },
        ]);
      });

      it('should handle multiple chains with varying permission counts', () => {
        const multiChainMockGatorPermissionsMap =
          mockGatorPermissionsStorageEntriesFactory({
            [MOCK_CHAIN_ID_MAINNET]: {
              nativeTokenStream: 5,
              nativeTokenPeriodic: 3,
              erc20TokenStream: 2,
              siteOrigin: 'http://localhost:8000',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              nativeTokenStream: 1,
              nativeTokenPeriodic: 0,
              erc20TokenStream: 4,
              siteOrigin: 'http://localhost:8001',
            },
          });

        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              multiChainMockGatorPermissionsMap,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        const result = getPermissionGroupMetaData(
          customState,
          'token-transfer',
        );

        // Expected: Mainnet: 5 + 3 + 2 = 10, Polygon: 1 + 0 + 4 = 5
        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 10,
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            count: 5,
          },
        ]);
      });
    });
  });

  describe('getPermissionMetaDataByOrigin', () => {
    describe('token transfer permissions by origin', () => {
      it('should return correct token transfer details for a site origin with permissions', () => {
        const result = getPermissionMetaDataByOrigin(
          mockState,
          'http://localhost:8000',
        );

        expect(result).toEqual({
          tokenTransfer: {
            count: 3,
            chains: [MOCK_CHAIN_ID_MAINNET],
          },
        });
      });

      it('should return correct token transfer details for different site origin', () => {
        const result = getPermissionMetaDataByOrigin(
          mockState,
          'http://localhost:8001',
        );

        expect(result).toEqual({
          tokenTransfer: {
            count: 3,
            chains: [MOCK_CHAIN_ID_POLYGON],
          },
        });
      });

      it('should return empty details for site origin with no permissions', () => {
        const result = getPermissionMetaDataByOrigin(
          mockState,
          'https://nonexistent.com',
        );

        expect(result).toEqual({
          tokenTransfer: {
            count: 0,
            chains: [],
          },
        });
      });

      it('should handle case-insensitive site origin matching', () => {
        const result = getPermissionMetaDataByOrigin(
          mockState,
          'HTTP://LOCALHOST:8000',
        );

        expect(result).toEqual({
          tokenTransfer: {
            count: 3,
            chains: [MOCK_CHAIN_ID_MAINNET],
          },
        });
      });

      it('should aggregate permissions across multiple chains for same origin', () => {
        const customMockGatorPermissionsMap =
          mockGatorPermissionsStorageEntriesFactory({
            [MOCK_CHAIN_ID_MAINNET]: {
              nativeTokenStream: 2,
              nativeTokenPeriodic: 1,
              erc20TokenStream: 1,
              siteOrigin: 'http://example.com',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              nativeTokenStream: 1,
              nativeTokenPeriodic: 2,
              erc20TokenStream: 0,
              siteOrigin: 'http://example.com',
            },
          });

        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              customMockGatorPermissionsMap,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        const result = getPermissionMetaDataByOrigin(
          customState,
          'http://example.com',
        );

        expect(result).toEqual({
          tokenTransfer: {
            count: 7,
            chains: [MOCK_CHAIN_ID_MAINNET, MOCK_CHAIN_ID_POLYGON],
          },
        });
      });

      it('should handle empty permissions map', () => {
        const emptyState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify({
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
                [MOCK_CHAIN_ID_MAINNET]: [],
                [MOCK_CHAIN_ID_POLYGON]: [],
              },
            }),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        const result = getPermissionMetaDataByOrigin(
          emptyState,
          'http://localhost:8000',
        );

        expect(result).toEqual({
          tokenTransfer: {
            count: 0,
            chains: [],
          },
        });
      });
    });

    describe('undefined values handling', () => {
      it('should throw error when undefined values are present in native-token-stream permissions', () => {
        const mockGatorPermissionsMapWithUndefined = {
          'native-token-stream': {
            [MOCK_CHAIN_ID_MAINNET]: [undefined, { permissionResponse: {} }],
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
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
        };

        const stateWithUndefined = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsMapWithUndefined,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        expect(() => {
          getPermissionMetaDataByOrigin(
            stateWithUndefined,
            'http://localhost:8000',
          );
        }).toThrow(
          'Undefined values present in the gatorPermissionsMap for permission type: native-token-stream',
        );
      });

      it('should throw error when undefined values are present in erc20-token-stream permissions', () => {
        const mockGatorPermissionsMapWithUndefined = {
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
            [MOCK_CHAIN_ID_POLYGON]: [undefined, { permissionResponse: {} }],
          },
          'erc20-token-periodic': {
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
          other: {
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
        };

        const stateWithUndefined = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsMapWithUndefined,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        expect(() => {
          getPermissionMetaDataByOrigin(
            stateWithUndefined,
            'http://localhost:8000',
          );
        }).toThrow(
          'Undefined values present in the gatorPermissionsMap for permission type: erc20-token-stream',
        );
      });

      it('should throw error when undefined values are present in native-token-periodic permissions', () => {
        const mockGatorPermissionsMapWithUndefined = {
          'native-token-stream': {
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
          'native-token-periodic': {
            [MOCK_CHAIN_ID_MAINNET]: [undefined, { permissionResponse: {} }],
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
        };

        const stateWithUndefined = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsMapWithUndefined,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        expect(() => {
          getPermissionMetaDataByOrigin(
            stateWithUndefined,
            'http://localhost:8000',
          );
        }).toThrow(
          'Undefined values present in the gatorPermissionsMap for permission type: native-token-periodic',
        );
      });

      it('should throw error when undefined values are present in erc20-token-periodic permissions', () => {
        const mockGatorPermissionsMapWithUndefined = {
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
            [MOCK_CHAIN_ID_POLYGON]: [undefined, { permissionResponse: {} }],
          },
          other: {
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
        };

        const stateWithUndefined = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsMapWithUndefined,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        expect(() => {
          getPermissionMetaDataByOrigin(
            stateWithUndefined,
            'http://localhost:8000',
          );
        }).toThrow(
          'Undefined values present in the gatorPermissionsMap for permission type: erc20-token-periodic',
        );
      });
    });

    describe('URL encoding handling', () => {
      it('should handle encoded site origin matching', () => {
        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsStorageEntriesFactory({
                [MOCK_CHAIN_ID_MAINNET]: {
                  nativeTokenStream: 1,
                  nativeTokenPeriodic: 1,
                  erc20TokenStream: 1,
                  siteOrigin: 'https://example.com',
                },
              }),
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        const result = getPermissionMetaDataByOrigin(
          customState,
          encodeURIComponent('https://example.com'),
        );

        expect(result.tokenTransfer.count).toBe(3);
        expect(result.tokenTransfer.chains).toEqual([MOCK_CHAIN_ID_MAINNET]);
      });

      it('should handle decoded site origin matching', () => {
        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsStorageEntriesFactory({
                [MOCK_CHAIN_ID_MAINNET]: {
                  nativeTokenStream: 1,
                  nativeTokenPeriodic: 1,
                  erc20TokenStream: 1,
                  siteOrigin: 'https://example.com/path%20with%20spaces',
                },
              }),
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
          },
        };

        const result = getPermissionMetaDataByOrigin(
          customState,
          'https://example.com/path with spaces',
        );

        expect(result.tokenTransfer.count).toBe(3);
        expect(result.tokenTransfer.chains).toEqual([MOCK_CHAIN_ID_MAINNET]);
      });
    });
  });
});
