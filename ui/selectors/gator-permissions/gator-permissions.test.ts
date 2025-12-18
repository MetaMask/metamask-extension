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
  getAggregatedGatorPermissionByChainId,
  AppState,
  getPermissionGroupMetaData,
  getPermissionMetaDataByOrigin,
  getUniqueSiteOriginsFromTokenTransferPermissions,
  getTokenTransferPermissionsByOrigin,
  getGatorPermissionCountsBySiteOrigin,
  getTotalUniqueSitesCount,
  getMergedConnectionsListWithGatorPermissions,
  getPendingRevocations,
  getPermissionGroupMetaDataByOrigin,
  getAggregatedGatorPermissionByChainIdAndOrigin,
} from './gator-permissions';

const MOCK_CHAIN_ID_MAINNET = '0x1' as Hex;
const MOCK_CHAIN_ID_POLYGON = '0x89' as Hex;

type MockGatorPermissionsStorageEntriesConfig = {
  [chainId: string]: {
    erc20TokenRevocation: number;
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
    'erc20-token-revocation': {
      [MOCK_CHAIN_ID_MAINNET]: [],
      [MOCK_CHAIN_ID_POLYGON]: [],
    },
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
      erc20TokenRevocation: 1,
      nativeTokenStream: 1,
      nativeTokenPeriodic: 1,
      erc20TokenStream: 1,
      siteOrigin: 'http://localhost:8000',
    },
    [MOCK_CHAIN_ID_POLYGON]: {
      erc20TokenRevocation: 1,
      nativeTokenStream: 1,
      nativeTokenPeriodic: 1,
      erc20TokenStream: 1,
      siteOrigin: 'http://localhost:8001',
    },
  });
  const mockState: AppState = {
    metamask: {
      gatorPermissionsMapSerialized: JSON.stringify(mockGatorPermissionsMap),
      isGatorPermissionsEnabled: true,
      isFetchingGatorPermissions: false,
      gatorPermissionsProviderSnapId: 'local:http://localhost:8080/' as SnapId,
      pendingRevocations: [],
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
              'erc20-token-revocation': {
                [MOCK_CHAIN_ID_MAINNET]: [],
                [MOCK_CHAIN_ID_POLYGON]: [],
              },
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
              erc20TokenRevocation: 1,
              nativeTokenStream: 2,
              nativeTokenPeriodic: 1,
              erc20TokenStream: 3,
              siteOrigin: 'http://localhost:8000',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              erc20TokenRevocation: 1,
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
          'erc20-token-revocation': {
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
          'erc20-token-revocation': {
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
          'erc20-token-revocation': {
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
              'erc20-token-revocation': {
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
          },
        };

        const result = getPermissionGroupMetaData(emptyState, 'token-transfer');
        expect(result).toEqual([]);
      });

      it('should handle different counts across chains correctly', () => {
        const customMockGatorPermissionsMap =
          mockGatorPermissionsStorageEntriesFactory({
            [MOCK_CHAIN_ID_MAINNET]: {
              erc20TokenRevocation: 1,
              nativeTokenStream: 2,
              nativeTokenPeriodic: 1,
              erc20TokenStream: 3,
              siteOrigin: 'http://localhost:8000',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              erc20TokenRevocation: 1,
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
              erc20TokenRevocation: 1,
              nativeTokenStream: 2,
              nativeTokenPeriodic: 1,
              erc20TokenStream: 0,
              siteOrigin: 'http://localhost:8000',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              erc20TokenRevocation: 1,
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
              erc20TokenRevocation: 1,
              nativeTokenStream: 0,
              nativeTokenPeriodic: 0,
              erc20TokenStream: 4,
              siteOrigin: 'http://localhost:8000',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              erc20TokenRevocation: 1,
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
              erc20TokenRevocation: 1,
              nativeTokenStream: 1,
              nativeTokenPeriodic: 0,
              erc20TokenStream: 2,
              siteOrigin: 'http://localhost:8000',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              erc20TokenRevocation: 1,
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
              erc20TokenRevocation: 1,
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
              erc20TokenRevocation: 1,
              nativeTokenStream: 5,
              nativeTokenPeriodic: 3,
              erc20TokenStream: 2,
              siteOrigin: 'http://localhost:8000',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              erc20TokenRevocation: 1,
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
              erc20TokenRevocation: 1,
              nativeTokenStream: 2,
              nativeTokenPeriodic: 1,
              erc20TokenStream: 1,
              siteOrigin: 'http://example.com',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              erc20TokenRevocation: 1,
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
              'erc20-token-revocation': {
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
          'erc20-token-revocation': {
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
          'erc20-token-revocation': {
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
          'erc20-token-revocation': {
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
          'erc20-token-revocation': {
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
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
                  erc20TokenRevocation: 1,
                  nativeTokenStream: 1,
                  nativeTokenPeriodic: 1,
                  erc20TokenStream: 1,
                  siteOrigin: 'https://example.com',
                },
              }),
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
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
                  erc20TokenRevocation: 1,
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
            pendingRevocations: [],
          },
        };

        const result = getPermissionMetaDataByOrigin(
          customState,
          'https://example.com/path with spaces',
        );

        expect(result.tokenTransfer.count).toBe(3);
        expect(result.tokenTransfer.chains).toEqual([MOCK_CHAIN_ID_MAINNET]);
      });

      it('should handle malformed URI components without throwing', () => {
        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsStorageEntriesFactory({
                [MOCK_CHAIN_ID_MAINNET]: {
                  erc20TokenRevocation: 1,
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
            pendingRevocations: [],
          },
        };

        // Test with malformed URI that would cause decodeURIComponent to throw
        expect(() => {
          getPermissionMetaDataByOrigin(customState, '%E0%A4%A');
        }).not.toThrow();

        // Test with empty string
        const emptyResult = getPermissionMetaDataByOrigin(customState, '');
        expect(emptyResult.tokenTransfer.count).toBe(0);
      });
    });
  });

  describe('getUniqueSiteOriginsFromTokenTransferPermissions', () => {
    it('should return unique site origins from token transfer permissions', () => {
      const result =
        getUniqueSiteOriginsFromTokenTransferPermissions(mockState);

      expect(result).toEqual(
        expect.arrayContaining([
          'http://localhost:8000',
          'http://localhost:8001',
        ]),
      );
      expect(result).toHaveLength(2);
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
            'erc20-token-revocation': {
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
          pendingRevocations: [],
        },
      };

      const result =
        getUniqueSiteOriginsFromTokenTransferPermissions(emptyState);
      expect(result).toEqual([]);
    });

    it('should deduplicate site origins across multiple chains', () => {
      const customMockGatorPermissionsMap =
        mockGatorPermissionsStorageEntriesFactory({
          [MOCK_CHAIN_ID_MAINNET]: {
            erc20TokenRevocation: 1,
            nativeTokenStream: 2,
            nativeTokenPeriodic: 1,
            erc20TokenStream: 1,
            siteOrigin: 'https://example.com',
          },
          [MOCK_CHAIN_ID_POLYGON]: {
            erc20TokenRevocation: 1,
            nativeTokenStream: 1,
            nativeTokenPeriodic: 2,
            erc20TokenStream: 1,
            siteOrigin: 'https://example.com',
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
          pendingRevocations: [],
        },
      };

      const result =
        getUniqueSiteOriginsFromTokenTransferPermissions(customState);
      expect(result).toEqual(['https://example.com']);
      expect(result).toHaveLength(1);
    });
  });

  describe('getTokenTransferPermissionsByOrigin', () => {
    describe('token transfer permissions by origin', () => {
      it('should return correct permissions for a site origin with permissions', () => {
        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsStorageEntriesFactory({
                [MOCK_CHAIN_ID_MAINNET]: {
                  erc20TokenRevocation: 1,
                  nativeTokenStream: 2,
                  nativeTokenPeriodic: 1,
                  erc20TokenStream: 1,
                  siteOrigin: 'http://localhost:8000',
                },
                [MOCK_CHAIN_ID_POLYGON]: {
                  erc20TokenRevocation: 1,
                  nativeTokenStream: 1,
                  nativeTokenPeriodic: 0,
                  erc20TokenStream: 1,
                  siteOrigin: 'http://localhost:8000',
                },
              }),
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
          },
        };

        const result = getTokenTransferPermissionsByOrigin(
          customState,
          'http://localhost:8000',
        );

        expect(result.length).toBe(6);
        expect(
          result.every((perm) => perm.siteOrigin === 'http://localhost:8000'),
        ).toBe(true);
      });

      it('should return empty array for site origin with no permissions', () => {
        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsStorageEntriesFactory({
                [MOCK_CHAIN_ID_MAINNET]: {
                  erc20TokenRevocation: 1,
                  nativeTokenStream: 1,
                  nativeTokenPeriodic: 1,
                  erc20TokenStream: 1,
                  siteOrigin: 'http://localhost:8000',
                },
              }),
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
          },
        };

        const result = getTokenTransferPermissionsByOrigin(
          customState,
          'http://different-origin.com',
        );

        expect(result).toEqual([]);
      });

      it('should handle case-insensitive site origin matching', () => {
        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsStorageEntriesFactory({
                [MOCK_CHAIN_ID_MAINNET]: {
                  erc20TokenRevocation: 1,
                  nativeTokenStream: 1,
                  nativeTokenPeriodic: 1,
                  erc20TokenStream: 1,
                  siteOrigin: 'http://Example.COM',
                },
              }),
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
          },
        };

        const result = getTokenTransferPermissionsByOrigin(
          customState,
          'http://example.com',
        );

        expect(result.length).toBe(3);
      });

      it('should aggregate permissions across multiple chains for same origin', () => {
        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsStorageEntriesFactory({
                [MOCK_CHAIN_ID_MAINNET]: {
                  erc20TokenRevocation: 1,
                  nativeTokenStream: 2,
                  nativeTokenPeriodic: 1,
                  erc20TokenStream: 0,
                  siteOrigin: 'http://localhost:8000',
                },
                [MOCK_CHAIN_ID_POLYGON]: {
                  erc20TokenRevocation: 1,
                  nativeTokenStream: 0,
                  nativeTokenPeriodic: 1,
                  erc20TokenStream: 2,
                  siteOrigin: 'http://localhost:8000',
                },
              }),
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            isUpdatingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
          },
        };

        const result = getTokenTransferPermissionsByOrigin(
          customState,
          'http://localhost:8000',
        );

        expect(result.length).toBe(6);
        const mainnetPermissions = result.filter(
          (perm) => perm.permissionResponse.chainId === MOCK_CHAIN_ID_MAINNET,
        );
        const polygonPermissions = result.filter(
          (perm) => perm.permissionResponse.chainId === MOCK_CHAIN_ID_POLYGON,
        );
        expect(mainnetPermissions.length).toBe(3);
        expect(polygonPermissions.length).toBe(3);
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
              'erc20-token-revocation': {
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
            pendingRevocations: [],
          },
        };

        const result = getTokenTransferPermissionsByOrigin(
          emptyState,
          'http://localhost:8000',
        );

        expect(result).toEqual([]);
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
          'erc20-token-revocation': {
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
            pendingRevocations: [],
          },
        };

        expect(() => {
          getTokenTransferPermissionsByOrigin(
            stateWithUndefined,
            'http://localhost:8000',
          );
        }).toThrow(
          'Undefined values present in the gatorPermissionsMap for permission type: native-token-stream',
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
          'erc20-token-revocation': {
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
            pendingRevocations: [],
          },
        };

        expect(() => {
          getTokenTransferPermissionsByOrigin(
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
                  erc20TokenRevocation: 1,
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
            pendingRevocations: [],
          },
        };

        const result = getTokenTransferPermissionsByOrigin(
          customState,
          encodeURIComponent('https://example.com'),
        );

        expect(result.length).toBe(3);
      });

      it('should handle decoded site origin matching', () => {
        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsStorageEntriesFactory({
                [MOCK_CHAIN_ID_MAINNET]: {
                  erc20TokenRevocation: 1,
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
            pendingRevocations: [],
          },
        };

        const result = getTokenTransferPermissionsByOrigin(
          customState,
          'https://example.com/path with spaces',
        );

        expect(result.length).toBe(3);
      });

      it('should handle malformed URI components without throwing', () => {
        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsStorageEntriesFactory({
                [MOCK_CHAIN_ID_MAINNET]: {
                  erc20TokenRevocation: 1,
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
            pendingRevocations: [],
          },
        };

        // Test with malformed URI that would cause decodeURIComponent to throw
        expect(() => {
          getTokenTransferPermissionsByOrigin(customState, '%E0%A4%A');
        }).not.toThrow();
      });
    });
  });

  describe('getAggregatedGatorPermissionByChainId', () => {
    it('should return aggregated token-transfer permissions for a given chainId', () => {
      const result = getAggregatedGatorPermissionByChainId(mockState, {
        aggregatedPermissionType: 'token-transfer',
        chainId: MOCK_CHAIN_ID_MAINNET,
      });

      expect(result).toHaveLength(3);

      const permissionTypes = result.map(
        (
          permission: StoredGatorPermissionSanitized<
            Signer,
            PermissionTypesWithCustom
          >,
        ) => permission.permissionResponse.permission.type,
      );
      expect(permissionTypes).toContain('native-token-stream');
      expect(permissionTypes).toContain('erc20-token-stream');
      expect(permissionTypes).toContain('native-token-periodic');
    });

    it('should return permissions sorted by startTime in ascending order', () => {
      const mockStateWithSortedPermissions = {
        metamask: {
          gatorPermissionsMapSerialized: JSON.stringify({
            'native-token-stream': {
              [MOCK_CHAIN_ID_MAINNET]: [
                {
                  permissionResponse: {
                    chainId: MOCK_CHAIN_ID_MAINNET as Hex,
                    address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                    permission: {
                      type: 'native-token-stream',
                      data: {
                        maxAmount: '0x22b1c8c1227a0000',
                        initialAmount: '0x6f05b59d3b20000',
                        amountPerSecond: '0x6f05b59d3b20000',
                        startTime: 1747699300, // Latest
                        justification: 'Test justification',
                      },
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
                    permission: {
                      type: 'erc20-token-stream',
                      data: {
                        initialAmount: '0x22b1c8c1227a0000',
                        maxAmount: '0x6f05b59d3b20000',
                        amountPerSecond: '0x6f05b59d3b20000',
                        startTime: 1747699100, // Earliest
                        tokenAddress:
                          '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                        justification: 'Test justification',
                      },
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
              [MOCK_CHAIN_ID_MAINNET]: [
                {
                  permissionResponse: {
                    chainId: MOCK_CHAIN_ID_MAINNET as Hex,
                    address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                    permission: {
                      type: 'native-token-periodic',
                      data: {
                        periodAmount: '0x22b1c8c1227a0000',
                        periodDuration: 1747699200,
                        startTime: 1747699200, // Middle
                        justification: 'Test justification',
                      },
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
            'erc20-token-periodic': {
              [MOCK_CHAIN_ID_MAINNET]: [],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
            'erc20-token-revocation': {
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
          gatorPermissionsProviderSnapId:
            'local:http://localhost:8080/' as SnapId,
          pendingRevocations: [],
        },
      };

      const result = getAggregatedGatorPermissionByChainId(
        mockStateWithSortedPermissions,
        {
          aggregatedPermissionType: 'token-transfer',
          chainId: MOCK_CHAIN_ID_MAINNET,
        },
      );

      expect(result).toHaveLength(3);
      // Verify they are sorted by startTime in ascending order
      expect(result[0].permissionResponse.permission.data.startTime).toBe(
        1747699100,
      );
      expect(result[1].permissionResponse.permission.data.startTime).toBe(
        1747699200,
      );
      expect(result[2].permissionResponse.permission.data.startTime).toBe(
        1747699300,
      );
    });

    it('should handle permissions with undefined startTime and place them first', () => {
      const mockStateWithUndefinedStartTime = {
        metamask: {
          gatorPermissionsMapSerialized: JSON.stringify({
            'native-token-stream': {
              [MOCK_CHAIN_ID_MAINNET]: [
                {
                  permissionResponse: {
                    chainId: MOCK_CHAIN_ID_MAINNET as Hex,
                    address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                    permission: {
                      type: 'native-token-stream',
                      data: {
                        maxAmount: '0x22b1c8c1227a0000',
                        initialAmount: '0x6f05b59d3b20000',
                        amountPerSecond: '0x6f05b59d3b20000',
                        startTime: 1747699200, // Has startTime
                        justification: 'Test justification',
                      },
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
                    permission: {
                      type: 'erc20-token-stream',
                      data: {
                        initialAmount: '0x22b1c8c1227a0000',
                        maxAmount: '0x6f05b59d3b20000',
                        amountPerSecond: '0x6f05b59d3b20000',
                        // No startTime - should be placed first
                        tokenAddress:
                          '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                        justification: 'Test justification',
                      },
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
            'erc20-token-revocation': {
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
          gatorPermissionsProviderSnapId:
            'local:http://localhost:8080/' as SnapId,
          pendingRevocations: [],
        },
      };

      const result = getAggregatedGatorPermissionByChainId(
        mockStateWithUndefinedStartTime,
        {
          aggregatedPermissionType: 'token-transfer',
          chainId: MOCK_CHAIN_ID_MAINNET,
        },
      );

      expect(result).toHaveLength(2);
      // Verify permission without startTime is placed first
      expect(result[0].permissionResponse.permission.type).toBe(
        'erc20-token-stream',
      );
      expect(result[0].permissionResponse.permission.data.startTime).toBe(
        undefined,
      );
      // Verify permission with startTime is placed after
      expect(result[1].permissionResponse.permission.type).toBe(
        'native-token-stream',
      );
      expect(result[1].permissionResponse.permission.data.startTime).toBe(
        1747699200,
      );
    });

    it('should return aggregated token-transfer permissions for a different chainId', () => {
      const result = getAggregatedGatorPermissionByChainId(mockState, {
        aggregatedPermissionType: 'token-transfer',
        chainId: MOCK_CHAIN_ID_POLYGON,
      });

      expect(result).toHaveLength(3);

      const permissionTypes = result.map(
        (
          permission: StoredGatorPermissionSanitized<
            Signer,
            PermissionTypesWithCustom
          >,
        ) => permission.permissionResponse.permission.type,
      );
      expect(permissionTypes).toContain('native-token-stream');
      expect(permissionTypes).toContain('erc20-token-stream');
      expect(permissionTypes).toContain('native-token-periodic');
    });

    it('should return empty array for non-existent chainId', () => {
      const result = getAggregatedGatorPermissionByChainId(mockState, {
        aggregatedPermissionType: 'token-transfer',
        chainId: '0x1111111111111111111111111111111111111111' as Hex,
      });

      expect(result).toEqual([]);
    });

    it('should return empty array for unknown aggregated permission type', () => {
      const result = getAggregatedGatorPermissionByChainId(mockState, {
        aggregatedPermissionType: 'unknown-type',
        chainId: MOCK_CHAIN_ID_MAINNET,
      });

      expect(result).toEqual([]);
    });

    it('should handle state with only some permission types populated', () => {
      const mockStateWithPartialPermissions = {
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
            'erc20-token-revocation': {
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
          gatorPermissionsProviderSnapId:
            'local:http://localhost:8080/' as SnapId,
          pendingRevocations: [],
        },
      };

      const result = getAggregatedGatorPermissionByChainId(
        mockStateWithPartialPermissions,
        {
          aggregatedPermissionType: 'token-transfer',
          chainId: MOCK_CHAIN_ID_MAINNET,
        },
      );

      expect(result).toHaveLength(1);
      expect(result[0].permissionResponse.permission.type).toBe(
        'native-token-stream',
      );
    });

    it('should handle state with empty permission arrays', () => {
      const mockStateWithEmptyPermissions = {
        metamask: {
          gatorPermissionsMapSerialized: JSON.stringify({
            'native-token-stream': {
              [MOCK_CHAIN_ID_MAINNET]: [],
              [MOCK_CHAIN_ID_POLYGON]: [],
            },
            'erc20-token-stream': {
              [MOCK_CHAIN_ID_MAINNET]: [],
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
            'erc20-token-revocation': {
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
          gatorPermissionsProviderSnapId:
            'local:http://localhost:8080/' as SnapId,
          pendingRevocations: [],
        },
      };

      const result = getAggregatedGatorPermissionByChainId(
        mockStateWithEmptyPermissions,
        {
          aggregatedPermissionType: 'token-transfer',
          chainId: MOCK_CHAIN_ID_MAINNET,
        },
      );

      expect(result).toEqual([]);
    });
  });

  describe('getGatorPermissionCountsBySiteOrigin', () => {
    it('should return a map with permission counts per site origin', () => {
      const result = getGatorPermissionCountsBySiteOrigin(mockState);

      expect(result).toBeInstanceOf(Map);
      expect(result.get('http://localhost:8000')).toBe(5);
      expect(result.get('http://localhost:8001')).toBe(3);
    });

    it('should return an empty map when no permissions exist', () => {
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
            'erc20-token-revocation': {
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
          gatorPermissionsProviderSnapId:
            'local:http://localhost:8080/' as SnapId,
          pendingRevocations: [],
        },
      };

      const result = getGatorPermissionCountsBySiteOrigin(emptyState);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('should aggregate counts for the same site origin across multiple chains', () => {
      const customMockGatorPermissionsMap =
        mockGatorPermissionsStorageEntriesFactory({
          [MOCK_CHAIN_ID_MAINNET]: {
            erc20TokenRevocation: 1,
            nativeTokenStream: 2,
            nativeTokenPeriodic: 1,
            erc20TokenStream: 1,
            siteOrigin: 'https://example.com',
          },
          [MOCK_CHAIN_ID_POLYGON]: {
            erc20TokenRevocation: 1,
            nativeTokenStream: 1,
            nativeTokenPeriodic: 2,
            erc20TokenStream: 1,
            siteOrigin: 'https://example.com',
          },
        });

      const customState = {
        metamask: {
          gatorPermissionsMapSerialized: JSON.stringify(
            customMockGatorPermissionsMap,
          ),
          isGatorPermissionsEnabled: true,
          isFetchingGatorPermissions: false,
          gatorPermissionsProviderSnapId:
            'local:http://localhost:8080/' as SnapId,
          pendingRevocations: [],
        },
      };

      const result = getGatorPermissionCountsBySiteOrigin(customState);
      expect(result.get('https://example.com')).toBe(8);
    });
  });

  describe('getTotalUniqueSitesCount', () => {
    it('should return the total count of unique sites from both connections and gator permissions', () => {
      const sitesConnectionsList = {
        'https://app1.com': {},
        'https://app2.com': {},
      };
      const gatorPermissionSiteOrigins = [
        'http://localhost:8000',
        'https://app1.com',
      ];

      const result = getTotalUniqueSitesCount.resultFunc(
        sitesConnectionsList,
        gatorPermissionSiteOrigins,
      );

      expect(result).toBe(3);
    });

    it('should return count when no traditional connections exist', () => {
      const sitesConnectionsList = {};
      const gatorPermissionSiteOrigins = [
        'http://localhost:8000',
        'http://localhost:8001',
      ];

      const result = getTotalUniqueSitesCount.resultFunc(
        sitesConnectionsList,
        gatorPermissionSiteOrigins,
      );

      expect(result).toBe(2);
    });
  });

  describe('getMergedConnectionsListWithGatorPermissions', () => {
    it('should add gator permission counts to existing connections', () => {
      const sitesConnectionsList = {
        'http://localhost:8000': {
          addresses: ['0x123'],
          origin: 'http://localhost:8000',
          name: 'Test Site',
          iconUrl: null,
          subjectType: 'website' as never,
          networkIconUrl: '',
          networkName: 'Mainnet',
          extensionId: null,
        },
      };
      const gatorPermissionCounts = new Map([
        ['http://localhost:8000', 3],
        ['http://localhost:8001', 2],
      ]);
      const mockStateForMetadata = {
        metamask: {
          subjectMetadata: {
            'http://localhost:8001': {
              name: 'Another Site',
              iconUrl: 'https://example.com/icon.png',
            },
          },
        },
      };

      const result = getMergedConnectionsListWithGatorPermissions.resultFunc(
        sitesConnectionsList,
        gatorPermissionCounts,
        mockStateForMetadata as never,
      );

      expect(result['http://localhost:8000'].advancedPermissionsCount).toBe(3);
      expect(result['http://localhost:8001']).toBeDefined();
      expect(result['http://localhost:8001'].advancedPermissionsCount).toBe(2);
      expect(result['http://localhost:8001'].addresses).toEqual([]);
    });
  });

  describe('getPendingRevocations', () => {
    it('should return the list of gator permissions pending a revocation transaction', () => {
      const result = getPendingRevocations({
        ...mockState,
        metamask: {
          ...mockState.metamask,
          pendingRevocations: [
            {
              txId: '1',
              permissionContext: '0x1',
            },
          ],
        },
      });
      expect(result).toEqual([
        {
          txId: '1',
          permissionContext: '0x1',
        },
      ]);
    });
  });

  describe('getPermissionGroupMetaDataByOrigin', () => {
    describe('token-transfer permission group', () => {
      it('should return correct metadata filtered by origin', () => {
        const multiOriginMockGatorPermissionsMap =
          mockGatorPermissionsStorageEntriesFactory({
            [MOCK_CHAIN_ID_MAINNET]: {
              erc20TokenRevocation: 1,
              nativeTokenStream: 2,
              nativeTokenPeriodic: 1,
              erc20TokenStream: 1,
              siteOrigin: 'https://example.com',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              erc20TokenRevocation: 1,
              nativeTokenStream: 1,
              nativeTokenPeriodic: 0,
              erc20TokenStream: 1,
              siteOrigin: 'https://example.com',
            },
          });

        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              multiOriginMockGatorPermissionsMap,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
          },
        };

        const result = getPermissionGroupMetaDataByOrigin(customState, {
          permissionGroupName: 'token-transfer',
          siteOrigin: 'https://example.com',
        });

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

      it('should return empty array when no permissions match the origin', () => {
        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsStorageEntriesFactory({
                [MOCK_CHAIN_ID_MAINNET]: {
                  erc20TokenRevocation: 1,
                  nativeTokenStream: 2,
                  nativeTokenPeriodic: 1,
                  erc20TokenStream: 1,
                  siteOrigin: 'https://example.com',
                },
              }),
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
          },
        };

        const result = getPermissionGroupMetaDataByOrigin(customState, {
          permissionGroupName: 'token-transfer',
          siteOrigin: 'https://different-origin.com',
        });

        expect(result).toEqual([]);
      });

      it('should handle URL-encoded origins correctly', () => {
        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsStorageEntriesFactory({
                [MOCK_CHAIN_ID_MAINNET]: {
                  erc20TokenRevocation: 1,
                  nativeTokenStream: 1,
                  nativeTokenPeriodic: 1,
                  erc20TokenStream: 1,
                  siteOrigin: 'https://example.com',
                },
              }),
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
          },
        };

        const result = getPermissionGroupMetaDataByOrigin(customState, {
          permissionGroupName: 'token-transfer',
          siteOrigin: encodeURIComponent('https://example.com'),
        });

        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 3,
          },
        ]);
      });

      it('should filter out permissions from other origins', () => {
        const mixedOriginMockGatorPermissionsMap = {
          'native-token-stream': {
            [MOCK_CHAIN_ID_MAINNET]: [
              {
                permissionResponse: {
                  chainId: MOCK_CHAIN_ID_MAINNET,
                  address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                  permission: { type: 'native-token-stream' },
                  context: '0x00000000',
                  signerMeta: {
                    delegationManager:
                      '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
                  },
                },
                siteOrigin: 'https://example.com',
              },
              {
                permissionResponse: {
                  chainId: MOCK_CHAIN_ID_MAINNET,
                  address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                  permission: { type: 'native-token-stream' },
                  context: '0x00000001',
                  signerMeta: {
                    delegationManager:
                      '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
                  },
                },
                siteOrigin: 'https://other-origin.com',
              },
            ],
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
          'erc20-token-revocation': {
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
          other: {
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
        };

        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mixedOriginMockGatorPermissionsMap,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
          },
        };

        const result = getPermissionGroupMetaDataByOrigin(customState, {
          permissionGroupName: 'token-transfer',
          siteOrigin: 'https://example.com',
        });

        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 1,
          },
        ]);
      });
    });

    describe('unknown permission group names', () => {
      it('should return empty array for unsupported permission group', () => {
        const result = getPermissionGroupMetaDataByOrigin(mockState, {
          permissionGroupName: 'unknown-permission-group',
          siteOrigin: 'https://example.com',
        });

        expect(result).toEqual([]);
      });
    });
  });

  describe('getAggregatedGatorPermissionByChainIdAndOrigin', () => {
    describe('token-transfer aggregated permission type', () => {
      it('should return permissions filtered by chainId and origin', () => {
        const mixedOriginMockGatorPermissionsMap = {
          'native-token-stream': {
            [MOCK_CHAIN_ID_MAINNET]: [
              {
                permissionResponse: {
                  chainId: MOCK_CHAIN_ID_MAINNET,
                  address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                  permission: { type: 'native-token-stream' },
                  context: '0x00000000',
                  signerMeta: {
                    delegationManager:
                      '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
                  },
                },
                siteOrigin: 'https://example.com',
              },
              {
                permissionResponse: {
                  chainId: MOCK_CHAIN_ID_MAINNET,
                  address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                  permission: { type: 'native-token-stream' },
                  context: '0x00000001',
                  signerMeta: {
                    delegationManager:
                      '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
                  },
                },
                siteOrigin: 'https://other-origin.com',
              },
            ],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
          'native-token-periodic': {
            [MOCK_CHAIN_ID_MAINNET]: [
              {
                permissionResponse: {
                  chainId: MOCK_CHAIN_ID_MAINNET,
                  address: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                  permission: { type: 'native-token-periodic' },
                  context: '0x00000002',
                  signerMeta: {
                    delegationManager:
                      '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
                  },
                },
                siteOrigin: 'https://example.com',
              },
            ],
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
          'erc20-token-revocation': {
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
          other: {
            [MOCK_CHAIN_ID_MAINNET]: [],
            [MOCK_CHAIN_ID_POLYGON]: [],
          },
        };

        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mixedOriginMockGatorPermissionsMap,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
          },
        };

        const result = getAggregatedGatorPermissionByChainIdAndOrigin(
          customState,
          {
            aggregatedPermissionType: 'token-transfer',
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
          },
        );

        expect(result).toHaveLength(2);
        expect(result[0].siteOrigin).toBe('https://example.com');
        expect(result[1].siteOrigin).toBe('https://example.com');
      });

      it('should return empty array when no permissions match the origin', () => {
        const result = getAggregatedGatorPermissionByChainIdAndOrigin(
          mockState,
          {
            aggregatedPermissionType: 'token-transfer',
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://non-existent-origin.com',
          },
        );

        expect(result).toEqual([]);
      });

      it('should handle URL-encoded origins correctly', () => {
        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsStorageEntriesFactory({
                [MOCK_CHAIN_ID_MAINNET]: {
                  erc20TokenRevocation: 1,
                  nativeTokenStream: 1,
                  nativeTokenPeriodic: 1,
                  erc20TokenStream: 1,
                  siteOrigin: 'https://example.com',
                },
              }),
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
          },
        };

        const result = getAggregatedGatorPermissionByChainIdAndOrigin(
          customState,
          {
            aggregatedPermissionType: 'token-transfer',
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: encodeURIComponent('https://example.com'),
          },
        );

        expect(result).toHaveLength(3);
        result.forEach((permission) => {
          expect(permission.siteOrigin).toBe('https://example.com');
        });
      });

      it('should return only permissions for the specified chainId', () => {
        const multiChainMockGatorPermissionsMap =
          mockGatorPermissionsStorageEntriesFactory({
            [MOCK_CHAIN_ID_MAINNET]: {
              erc20TokenRevocation: 1,
              nativeTokenStream: 2,
              nativeTokenPeriodic: 1,
              erc20TokenStream: 1,
              siteOrigin: 'https://example.com',
            },
            [MOCK_CHAIN_ID_POLYGON]: {
              erc20TokenRevocation: 1,
              nativeTokenStream: 3,
              nativeTokenPeriodic: 2,
              erc20TokenStream: 1,
              siteOrigin: 'https://example.com',
            },
          });

        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              multiChainMockGatorPermissionsMap,
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
          },
        };

        const result = getAggregatedGatorPermissionByChainIdAndOrigin(
          customState,
          {
            aggregatedPermissionType: 'token-transfer',
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
          },
        );

        expect(result).toHaveLength(4);
        result.forEach((permission) => {
          expect(permission.permissionResponse.chainId).toBe(
            MOCK_CHAIN_ID_MAINNET,
          );
        });
      });

      it('should handle malformed URI components without throwing', () => {
        const customState = {
          metamask: {
            gatorPermissionsMapSerialized: JSON.stringify(
              mockGatorPermissionsStorageEntriesFactory({
                [MOCK_CHAIN_ID_MAINNET]: {
                  erc20TokenRevocation: 1,
                  nativeTokenStream: 1,
                  nativeTokenPeriodic: 1,
                  erc20TokenStream: 1,
                  siteOrigin: 'https://example.com',
                },
              }),
            ),
            isGatorPermissionsEnabled: true,
            isFetchingGatorPermissions: false,
            gatorPermissionsProviderSnapId:
              'local:http://localhost:8080/' as SnapId,
            pendingRevocations: [],
          },
        };

        // Test with malformed URI that would cause decodeURIComponent to throw
        expect(() => {
          getAggregatedGatorPermissionByChainIdAndOrigin(customState, {
            aggregatedPermissionType: 'token-transfer',
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: '%E0%A4%A',
          });
        }).not.toThrow();
      });
    });

    describe('unknown aggregated permission type', () => {
      it('should return empty array for unknown permission type', () => {
        const result = getAggregatedGatorPermissionByChainIdAndOrigin(
          mockState,
          {
            aggregatedPermissionType: 'unknown-permission-type',
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
          },
        );

        expect(result).toEqual([]);
      });
    });
  });
});
