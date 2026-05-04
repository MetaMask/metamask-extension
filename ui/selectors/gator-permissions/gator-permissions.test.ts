import type {
  PermissionInfoWithMetadata,
  SupportedPermissionType,
} from '@metamask/gator-permissions-controller';
import { Hex } from '@metamask/utils';
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

function createPermissionInfoWithMetadata<
  TPermissionType extends SupportedPermissionType,
>({
  permissionType,
  chainId,
  siteOrigin,
}: {
  permissionType: TPermissionType;
  chainId: Hex;
  siteOrigin: string;
}): PermissionInfoWithMetadata {
  let permissionData: PermissionInfoWithMetadata['permissionResponse']['permission']['data'];

  switch (permissionType) {
    case 'native-token-stream':
      permissionData = {
        maxAmount: '0x22b1c8c1227a0000',
        initialAmount: '0x6f05b59d3b20000',
        amountPerSecond: '0x6f05b59d3b20000',
        startTime: 1747699200,
        justification: 'Justification for native token stream',
      };
      break;
    case 'native-token-periodic':
      permissionData = {
        periodAmount: '0x22b1c8c1227a0000',
        periodDuration: 1747699200,
        startTime: 1747699200,
        justification: 'Justification for native token periodic',
      };
      break;
    case 'erc20-token-stream':
      permissionData = {
        initialAmount: '0x22b1c8c1227a0000',
        maxAmount: '0x6f05b59d3b20000',
        amountPerSecond: '0x6f05b59d3b20000',
        startTime: 1747699200,
        justification: 'Justification for erc20 token stream',
      };
      break;
    case 'erc20-token-periodic':
      permissionData = {
        periodAmount: '0x22b1c8c1227a0000',
        periodDuration: 1747699200,
        startTime: 1747699200,
        justification: 'Justification for erc20 token periodic',
      };
      break;
    case 'erc20-token-revocation':
      permissionData = {
        justification: 'Justification for erc20 token revocation',
      };
      break;
    default:
      throw new Error(
        `Unsupported permission type: ${permissionType as unknown as string}`,
      );
  }

  return {
    permissionResponse: {
      chainId,
      from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
      permission: {
        type: permissionType,
        isAdjustmentAllowed: false,
        data: permissionData,
      } as PermissionInfoWithMetadata['permissionResponse']['permission'],
      context: '0x00000000',
      delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
    },
    siteOrigin,
  };
}

function createMockState(
  configs: {
    chainId: Hex;
    siteOrigin: string;
    permissions: { permissionType: SupportedPermissionType; count: number }[];
  }[],
): AppState {
  const grantedPermissions = configs.reduce(
    (acc, { chainId, siteOrigin, permissions }) => {
      permissions.forEach(({ permissionType, count }) => {
        acc.push(
          ...Array.from({ length: count }, () =>
            createPermissionInfoWithMetadata({
              permissionType,
              chainId,
              siteOrigin,
            }),
          ),
        );
      });
      return acc;
    },
    [] as PermissionInfoWithMetadata[],
  );

  return {
    metamask: {
      grantedPermissions,
      isFetchingGatorPermissions: false,
      pendingRevocations: [],
      lastSyncedTimestamp: -1,
    },
  };
}

describe('Gator Permissions Selectors', () => {
  const mockState = createMockState([
    {
      chainId: MOCK_CHAIN_ID_MAINNET,
      siteOrigin: 'http://localhost:8000',
      permissions: [
        { permissionType: 'erc20-token-revocation', count: 1 },
        { permissionType: 'native-token-stream', count: 1 },
        { permissionType: 'native-token-periodic', count: 1 },
        { permissionType: 'erc20-token-stream', count: 1 },
      ],
    },
    {
      chainId: MOCK_CHAIN_ID_POLYGON,
      siteOrigin: 'http://localhost:8001',
      permissions: [
        { permissionType: 'erc20-token-revocation', count: 1 },
        { permissionType: 'native-token-stream', count: 1 },
        { permissionType: 'erc20-token-stream', count: 1 },
      ],
    },
  ]);

  describe('getGatorPermissionsMap', () => {
    it('should derive map from grantedPermissions state', () => {
      const map = getGatorPermissionsMap(mockState);

      expect(Object.keys(map)).toEqual([
        'native-token-stream',
        'erc20-token-stream',
        'native-token-periodic',
        'erc20-token-periodic',
        'erc20-token-revocation',
        'other',
      ]);

      const nativeTokenStreams = map['native-token-stream'] ?? {};
      expect(Object.keys(nativeTokenStreams)).toEqual([
        MOCK_CHAIN_ID_MAINNET,
        MOCK_CHAIN_ID_POLYGON,
      ]);

      expect(nativeTokenStreams[MOCK_CHAIN_ID_MAINNET]).toStrictEqual([
        createPermissionInfoWithMetadata({
          permissionType: 'native-token-stream',
          chainId: MOCK_CHAIN_ID_MAINNET,
          siteOrigin: 'http://localhost:8000',
        }),
      ]);

      expect(nativeTokenStreams[MOCK_CHAIN_ID_POLYGON]).toStrictEqual([
        createPermissionInfoWithMetadata({
          permissionType: 'native-token-stream',
          chainId: MOCK_CHAIN_ID_POLYGON,
          siteOrigin: 'http://localhost:8001',
        }),
      ]);

      const erc20TokenStreams = map['erc20-token-stream'] ?? {};
      expect(Object.keys(erc20TokenStreams)).toEqual([
        MOCK_CHAIN_ID_MAINNET,
        MOCK_CHAIN_ID_POLYGON,
      ]);

      expect(erc20TokenStreams[MOCK_CHAIN_ID_MAINNET]).toStrictEqual([
        createPermissionInfoWithMetadata({
          permissionType: 'erc20-token-stream',
          chainId: MOCK_CHAIN_ID_MAINNET,
          siteOrigin: 'http://localhost:8000',
        }),
      ]);

      expect(erc20TokenStreams[MOCK_CHAIN_ID_POLYGON]).toStrictEqual([
        createPermissionInfoWithMetadata({
          permissionType: 'erc20-token-stream',
          chainId: MOCK_CHAIN_ID_POLYGON,
          siteOrigin: 'http://localhost:8001',
        }),
      ]);

      const nativeTokenPeriodics = map['native-token-periodic'] ?? {};
      expect(Object.keys(nativeTokenPeriodics)).toEqual([
        MOCK_CHAIN_ID_MAINNET,
      ]);

      expect(nativeTokenPeriodics[MOCK_CHAIN_ID_MAINNET]).toStrictEqual([
        createPermissionInfoWithMetadata({
          permissionType: 'native-token-periodic',
          chainId: MOCK_CHAIN_ID_MAINNET,
          siteOrigin: 'http://localhost:8000',
        }),
      ]);

      const erc20TokenPeriodics = map['erc20-token-periodic'] ?? {};
      expect(Object.keys(erc20TokenPeriodics)).toEqual([]);
    });

    it('should return map with all keys when grantedPermissions is empty', () => {
      const stateWithEmpty: AppState = createMockState([]);
      const result = getGatorPermissionsMap(stateWithEmpty);
      expect(result['native-token-stream']).toEqual({});
      expect(result['erc20-token-stream']).toEqual({});
      expect(result['native-token-periodic']).toEqual({});
      expect(result['erc20-token-periodic']).toEqual({});
      expect(result['erc20-token-revocation']).toEqual({});
      expect(result.other).toEqual({});
    });
  });

  describe('getAggregatedGatorPermissionsCountAcrossAllChains', () => {
    describe('token-transfer aggregated permission type', () => {
      it('should return the correct count for token-transfer with all permission types', () => {
        const result = getAggregatedGatorPermissionsCountAcrossAllChains(
          mockState,
          'token-transfer',
        );
        // Mainnet: 4 (erc20-revocation + native-stream + native-periodic + erc20-stream), Polygon: 3 (erc20-revocation + native-stream + erc20-stream), total = 7
        expect(result).toBe(7);
      });

      it('should return 0 when no permissions exist', () => {
        const emptyState = createMockState([]);

        const result = getAggregatedGatorPermissionsCountAcrossAllChains(
          emptyState,
          'token-transfer',
        );
        expect(result).toBe(0);
      });

      it('should handle different counts across chains correctly', () => {
        const testSpecificMockState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'http://localhost:8000',
            permissions: [
              { permissionType: 'erc20-token-revocation', count: 1 },
              { permissionType: 'native-token-stream', count: 2 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 3 },
              { permissionType: 'erc20-token-periodic', count: 1 },
            ],
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            siteOrigin: 'http://localhost:8001',
            permissions: [
              { permissionType: 'erc20-token-revocation', count: 1 },
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 2 },
            ],
          },
        ]);

        const result = getAggregatedGatorPermissionsCountAcrossAllChains(
          testSpecificMockState,
          'token-transfer',
        );
        expect(result).toBe(12);
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
  });

  describe('getPermissionGroupMetaData', () => {
    describe('token-transfer permission group', () => {
      it('should return correct permission group details for token-transfer with all permission types', () => {
        const result = getPermissionGroupMetaData(mockState, 'token-transfer');

        // Expected: 2 chains, each with 3 permissions (1 native-token-stream + 1 native-token-periodic + 1 erc20-token-stream)
        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 4,
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            count: 3,
          },
        ]);
      });

      it('should return empty array when no permissions exist', () => {
        const emptyState = createMockState([]);

        const result = getPermissionGroupMetaData(emptyState, 'token-transfer');
        expect(result).toEqual([]);
      });

      it('should handle different counts across chains correctly', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'http://localhost:8000',
            permissions: [
              { permissionType: 'native-token-stream', count: 2 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 3 },
            ],
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            siteOrigin: 'http://localhost:8001',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 2 },
            ],
          },
        ]);

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
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'http://localhost:8000',
            permissions: [
              { permissionType: 'native-token-stream', count: 2 },
              { permissionType: 'native-token-periodic', count: 1 },
            ],
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            siteOrigin: 'http://localhost:8001',
            permissions: [
              { permissionType: 'native-token-periodic', count: 2 },
            ],
          },
        ]);

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
            count: 2,
          },
        ]);
      });

      it('should handle only ERC20 token permissions', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'http://localhost:8000',
            permissions: [
              { permissionType: 'erc20-token-stream', count: 4 },
              { permissionType: 'erc20-token-revocation', count: 1 },
            ],
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            siteOrigin: 'http://localhost:8001',
            permissions: [
              { permissionType: 'erc20-token-stream', count: 2 },
              { permissionType: 'erc20-token-revocation', count: 1 },
            ],
          },
        ]);

        const result = getPermissionGroupMetaData(
          customState,
          'token-transfer',
        );

        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 5,
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            count: 3,
          },
        ]);
      });

      it('should handle mixed permission types with different counts', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'http://localhost:8000',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'erc20-token-stream', count: 2 },
              { permissionType: 'erc20-token-revocation', count: 1 },
            ],
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            siteOrigin: 'http://localhost:8001',
            permissions: [
              { permissionType: 'native-token-periodic', count: 2 },
              { permissionType: 'erc20-token-stream', count: 1 },
              { permissionType: 'erc20-token-revocation', count: 1 },
            ],
          },
        ]);

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
            count: 4,
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
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'http://localhost:8000',
            permissions: [
              { permissionType: 'erc20-token-revocation', count: 1 },
              { permissionType: 'native-token-stream', count: 2 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

        const result = getPermissionGroupMetaData(
          customState,
          'token-transfer',
        );

        // Expected: Mainnet: 2 + 1 + 1 + 1 = 5
        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 5,
          },
        ]);
      });

      it('should handle multiple chains with varying permission counts', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'http://localhost:8000',
            permissions: [
              { permissionType: 'erc20-token-revocation', count: 1 },
              { permissionType: 'native-token-stream', count: 7 },
              { permissionType: 'native-token-periodic', count: 3 },
            ],
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            siteOrigin: 'http://localhost:8001',
            permissions: [
              { permissionType: 'erc20-token-revocation', count: 1 },
              { permissionType: 'native-token-stream', count: 5 },
              { permissionType: 'native-token-periodic', count: 0 },
            ],
          },
        ]);

        const result = getPermissionGroupMetaData(
          customState,
          'token-transfer',
        );

        // Expected: Mainnet: 1+7+3 = 11, Polygon: 1+5+0 = 6
        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 11,
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            count: 6,
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
            count: 4,
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
            count: 4,
            chains: [MOCK_CHAIN_ID_MAINNET],
          },
        });
      });

      it('should aggregate permissions across multiple chains for same origin', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'http://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 2 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            siteOrigin: 'http://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 2 },
            ],
          },
        ]);

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
        const emptyState = createMockState([]);

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

    describe('URL encoding handling', () => {
      it('should handle encoded site origin matching', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

        const result = getPermissionMetaDataByOrigin(
          customState,
          encodeURIComponent('https://example.com'),
        );

        expect(result.tokenTransfer.count).toBe(3);
        expect(result.tokenTransfer.chains).toEqual([MOCK_CHAIN_ID_MAINNET]);
      });

      it('should handle decoded site origin matching', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com/path%20with%20spaces',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

        const result = getPermissionMetaDataByOrigin(
          customState,
          'https://example.com/path with spaces',
        );

        expect(result.tokenTransfer.count).toBe(3);
        expect(result.tokenTransfer.chains).toEqual([MOCK_CHAIN_ID_MAINNET]);
      });

      it('should handle malformed URI components without throwing', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

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
      const emptyState = createMockState([]);

      const result =
        getUniqueSiteOriginsFromTokenTransferPermissions(emptyState);
      expect(result).toEqual([]);
    });

    it('should deduplicate site origins across multiple chains', () => {
      const customState = createMockState([
        {
          chainId: MOCK_CHAIN_ID_MAINNET,
          siteOrigin: 'https://example.com',
          permissions: [
            { permissionType: 'native-token-stream', count: 2 },
            { permissionType: 'native-token-periodic', count: 1 },
            { permissionType: 'erc20-token-stream', count: 1 },
          ],
        },
        {
          chainId: MOCK_CHAIN_ID_POLYGON,
          siteOrigin: 'https://example.com',
          permissions: [
            { permissionType: 'native-token-stream', count: 1 },
            { permissionType: 'native-token-periodic', count: 2 },
            { permissionType: 'erc20-token-stream', count: 1 },
          ],
        },
      ]);

      const result =
        getUniqueSiteOriginsFromTokenTransferPermissions(customState);
      expect(result).toEqual(['https://example.com']);
      expect(result).toHaveLength(1);
    });
  });

  describe('getTokenTransferPermissionsByOrigin', () => {
    describe('token transfer permissions by origin', () => {
      it('should return correct permissions for a site origin with permissions', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'http://localhost:8000',
            permissions: [
              { permissionType: 'native-token-stream', count: 2 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            siteOrigin: 'http://localhost:8000',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

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
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

        const result = getTokenTransferPermissionsByOrigin(
          customState,
          'http://different-origin.com',
        );

        expect(result).toEqual([]);
      });

      it('should handle case-insensitive site origin matching', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://EXAMPLE.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

        const result = getTokenTransferPermissionsByOrigin(
          customState,
          'https://example.com',
        );

        expect(result.length).toBe(3);
      });

      it('should aggregate permissions across multiple chains for same origin', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'http://localhost:8000',
            permissions: [
              { permissionType: 'native-token-stream', count: 2 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 0 },
            ],
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            siteOrigin: 'http://localhost:8000',
            permissions: [
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 2 },
            ],
          },
        ]);

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
        const emptyState = createMockState([]);

        const result = getTokenTransferPermissionsByOrigin(
          emptyState,
          'http://localhost:8000',
        );

        expect(result).toEqual([]);
      });
    });

    describe('URL encoding handling', () => {
      it('should handle encoded site origin matching', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

        const result = getTokenTransferPermissionsByOrigin(
          customState,
          encodeURIComponent('https://example.com'),
        );

        expect(result.length).toBe(3);
      });

      it('should handle decoded site origin matching', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com/path%20with%20spaces',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

        const result = getTokenTransferPermissionsByOrigin(
          customState,
          'https://example.com/path with spaces',
        );

        expect(result.length).toBe(3);
      });

      it('should handle malformed URI components without throwing', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

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

      expect(result).toHaveLength(4);

      const permissionTypes = result.map(
        (permission: PermissionInfoWithMetadata) =>
          permission.permissionResponse.permission.type,
      );
      expect(permissionTypes).toContain('erc20-token-revocation');
      expect(permissionTypes).toContain('native-token-stream');
      expect(permissionTypes).toContain('erc20-token-stream');
      expect(permissionTypes).toContain('native-token-periodic');
    });

    it('should return permissions sorted by startTime in ascending order', () => {
      const mockStateWithUnsortedPermissions = createMockState([
        {
          chainId: MOCK_CHAIN_ID_MAINNET,
          siteOrigin: 'http://localhost:8000',
          permissions: [
            { permissionType: 'native-token-stream', count: 1 },
            { permissionType: 'native-token-periodic', count: 1 },
            { permissionType: 'erc20-token-stream', count: 1 },
          ],
        },
      ]);

      // it's important that these permission types have a startTime property, or the test may be invalid
      mockStateWithUnsortedPermissions.metamask.grantedPermissions[0].permissionResponse.permission.data.startTime = 200;
      mockStateWithUnsortedPermissions.metamask.grantedPermissions[1].permissionResponse.permission.data.startTime = 300;
      mockStateWithUnsortedPermissions.metamask.grantedPermissions[2].permissionResponse.permission.data.startTime = 100;

      const result = getAggregatedGatorPermissionByChainId(
        mockStateWithUnsortedPermissions,
        {
          aggregatedPermissionType: 'token-transfer',
          chainId: MOCK_CHAIN_ID_MAINNET,
        },
      );

      expect(result).toHaveLength(3);
      // Verify they are sorted by startTime in ascending order
      expect(result[0].permissionResponse.permission.data.startTime).toBe(100);
      expect(result[1].permissionResponse.permission.data.startTime).toBe(200);
      expect(result[2].permissionResponse.permission.data.startTime).toBe(300);
    });

    it('should handle permissions with undefined startTime and place them first', () => {
      const mockStateWithUndefinedStartTime = createMockState([
        {
          chainId: MOCK_CHAIN_ID_MAINNET,
          siteOrigin: 'http://localhost:8000',
          permissions: [
            { permissionType: 'native-token-stream', count: 1 },
            { permissionType: 'erc20-token-stream', count: 1 },
          ],
        },
      ]);

      // it's important that these permission types have a startTime property, or the test may be invalid
      mockStateWithUndefinedStartTime.metamask.grantedPermissions[0].permissionResponse.permission.data.startTime = 100;
      mockStateWithUndefinedStartTime.metamask.grantedPermissions[1].permissionResponse.permission.data.startTime =
        undefined;

      const result = getAggregatedGatorPermissionByChainId(
        mockStateWithUndefinedStartTime,
        {
          aggregatedPermissionType: 'token-transfer',
          chainId: MOCK_CHAIN_ID_MAINNET,
        },
      );

      expect(result).toHaveLength(2);
      // Verify permission without startTime is placed first

      expect(result[0].permissionResponse.permission.data.startTime).toBe(
        undefined,
      );
      // Verify permission with startTime is placed after

      expect(result[1].permissionResponse.permission.data.startTime).toBe(100);
    });

    it('should return aggregated token-transfer permissions for a different chainId', () => {
      const result = getAggregatedGatorPermissionByChainId(mockState, {
        aggregatedPermissionType: 'token-transfer',
        chainId: MOCK_CHAIN_ID_POLYGON,
      });

      expect(result).toHaveLength(3);

      const permissionTypes = result.map(
        (permission: PermissionInfoWithMetadata) =>
          permission.permissionResponse.permission.type,
      );
      expect(permissionTypes).toContain('erc20-token-revocation');
      expect(permissionTypes).toContain('native-token-stream');
      expect(permissionTypes).toContain('erc20-token-stream');
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
  });

  describe('getGatorPermissionCountsBySiteOrigin', () => {
    it('should return a map with permission counts per site origin', () => {
      const result = getGatorPermissionCountsBySiteOrigin(mockState);

      expect(result).toBeInstanceOf(Map);
      expect(result.get('http://localhost:8000')).toBe(4);
      expect(result.get('http://localhost:8001')).toBe(3);
    });

    it('should return an empty map when no permissions exist', () => {
      const emptyState = createMockState([]);

      const result = getGatorPermissionCountsBySiteOrigin(emptyState);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('should aggregate counts for the same site origin across multiple chains', () => {
      const customState = createMockState([
        {
          chainId: MOCK_CHAIN_ID_MAINNET,
          siteOrigin: 'https://example.com',
          permissions: [
            { permissionType: 'native-token-stream', count: 2 },
            { permissionType: 'native-token-periodic', count: 1 },
            { permissionType: 'erc20-token-stream', count: 1 },
          ],
        },
        {
          chainId: MOCK_CHAIN_ID_POLYGON,
          siteOrigin: 'https://example.com',
          permissions: [
            { permissionType: 'native-token-stream', count: 1 },
            { permissionType: 'native-token-periodic', count: 2 },
            { permissionType: 'erc20-token-stream', count: 1 },
          ],
        },
      ]);

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
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 2 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

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
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

        const result = getPermissionGroupMetaDataByOrigin(customState, {
          permissionGroupName: 'token-transfer',
          siteOrigin: 'https://different-origin.com',
        });

        expect(result).toEqual([]);
      });

      it('should handle URL-encoded origins correctly', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

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
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
            permissions: [{ permissionType: 'native-token-stream', count: 1 }],
          },
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://other-origin.com',
            permissions: [{ permissionType: 'native-token-stream', count: 1 }],
          },
        ]);

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
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 1 },
            ],
          },
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://other-origin.com',
            permissions: [{ permissionType: 'native-token-stream', count: 1 }],
          },
        ]);

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
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

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
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'erc20-token-revocation', count: 1 },
              { permissionType: 'native-token-stream', count: 2 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
          {
            chainId: MOCK_CHAIN_ID_POLYGON,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'erc20-token-revocation', count: 1 },
              { permissionType: 'native-token-stream', count: 3 },
              { permissionType: 'native-token-periodic', count: 2 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

        const result = getAggregatedGatorPermissionByChainIdAndOrigin(
          customState,
          {
            aggregatedPermissionType: 'token-transfer',
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
          },
        );

        expect(result).toHaveLength(5);
        result.forEach((permission) => {
          expect(permission.permissionResponse.chainId).toBe(
            MOCK_CHAIN_ID_MAINNET,
          );
        });
      });

      it('should handle malformed URI components without throwing', () => {
        const customState = createMockState([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            siteOrigin: 'https://example.com',
            permissions: [
              { permissionType: 'native-token-stream', count: 1 },
              { permissionType: 'native-token-periodic', count: 1 },
              { permissionType: 'erc20-token-stream', count: 1 },
            ],
          },
        ]);

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
