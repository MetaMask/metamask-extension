import type {
  NativeTokenPeriodicPermission,
  NativeTokenStreamPermission,
  PermissionInfoWithMetadata,
} from '@metamask/gator-permissions-controller';
import { Hex } from '@metamask/utils';
import {
  AppState,
  TOKEN_TRANSFER_GROUP,
  getGatorPermissionCount,
  getGatorPermissionCountByChain,
  getGatorPermissionsForChain,
  getGatorPermissionsByOrigin,
  getGatorPermissionSummaryByOrigin,
  getTotalUniqueSitesCount,
  getMergedConnectionsListWithGatorPermissions,
  getPendingRevocations,
} from './gator-permissions';

const MOCK_CHAIN_ID_MAINNET = '0x1' as Hex;
const MOCK_CHAIN_ID_POLYGON = '0x89' as Hex;

/** Input for buildMockGrantedPermissions: counts per chain and a single siteOrigin for that chain. */
type BuildMockGrantedPermissionsInput = {
  [chainId: string]: {
    nativeTokenStream: number;
    nativeTokenPeriodic: number;
    erc20TokenStream: number;
    siteOrigin: string;
  };
};

const DELEGATION_MANAGER = '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3';
const FROM = '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778';
const CONTEXT = '0x00000000';
const JUSTIFICATION =
  'This is a very important request for streaming allowance for some very important thing';

/**
 * Creates an array of mock permission entries from a template.
 *
 * @param amount
 * @param template
 */
function createMockPermissionEntries(
  amount: number,
  template: PermissionInfoWithMetadata,
): PermissionInfoWithMetadata[] {
  return Array.from({ length: amount }, () => ({ ...template }));
}

/**
 * Builds a flat grantedPermissions array from a simple config (counts per chain + siteOrigin).
 * No intermediate map; directly produces the array that the implementation iterates over.
 *
 * @param config
 */
function buildMockGrantedPermissions(
  config: BuildMockGrantedPermissionsInput,
): PermissionInfoWithMetadata[] {
  const result: PermissionInfoWithMetadata[] = [];

  for (const [chainId, options] of Object.entries(config)) {
    const chainIdHex = chainId as Hex;

    const nativeStream: PermissionInfoWithMetadata = {
      permissionResponse: {
        chainId: chainIdHex,
        from: FROM,
        permission: {
          type: 'native-token-stream',
          isAdjustmentAllowed: false,
          data: {
            maxAmount: '0x22b1c8c1227a0000',
            initialAmount: '0x6f05b59d3b20000',
            amountPerSecond: '0x6f05b59d3b20000',
            startTime: 1747699200,
            justification: JUSTIFICATION,
          },
        },
        context: CONTEXT,
        delegationManager: DELEGATION_MANAGER,
      },
      siteOrigin: options.siteOrigin,
    };

    const nativePeriodic: PermissionInfoWithMetadata = {
      permissionResponse: {
        chainId: chainIdHex,
        from: FROM,
        permission: {
          type: 'native-token-periodic',
          isAdjustmentAllowed: false,
          data: {
            periodAmount: '0x22b1c8c1227a0000',
            periodDuration: 1747699200,
            startTime: 1747699200,
            justification: JUSTIFICATION,
          },
        },
        context: CONTEXT,
        delegationManager: DELEGATION_MANAGER,
      },
      siteOrigin: options.siteOrigin,
    };

    const erc20Stream: PermissionInfoWithMetadata = {
      permissionResponse: {
        chainId: chainIdHex,
        from: FROM,
        permission: {
          type: 'erc20-token-stream',
          isAdjustmentAllowed: false,
          data: {
            initialAmount: '0x22b1c8c1227a0000',
            maxAmount: '0x6f05b59d3b20000',
            amountPerSecond: '0x6f05b59d3b20000',
            startTime: 1747699200,
            tokenAddress: FROM,
            justification: JUSTIFICATION,
          },
        },
        context: CONTEXT,
        delegationManager: DELEGATION_MANAGER,
      },
      siteOrigin: options.siteOrigin,
    };

    result.push(
      ...createMockPermissionEntries(options.nativeTokenStream, nativeStream),
      ...createMockPermissionEntries(
        options.nativeTokenPeriodic,
        nativePeriodic,
      ),
      ...createMockPermissionEntries(options.erc20TokenStream, erc20Stream),
    );
  }

  return result;
}

describe('Gator Permissions Selectors', () => {
  const mockState: AppState = {
    metamask: {
      grantedPermissions: buildMockGrantedPermissions({
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
      }),
      isFetchingGatorPermissions: false,
      pendingRevocations: [],
      lastSyncedTimestamp: -1,
    },
  };

  describe('getGatorPermissionCountByChain', () => {
    it('returns count by chain from grantedPermissions state', () => {
      const result = getGatorPermissionCountByChain(
        mockState,
        TOKEN_TRANSFER_GROUP,
      );
      expect(Array.isArray(result)).toBe(true);
      expect(result.every((r) => 'chainId' in r && 'count' in r)).toBe(true);
    });

    it('returns expected shape when grantedPermissions has one permission', () => {
      const stateWithPartial: AppState = {
        metamask: {
          grantedPermissions: [
            {
              permissionResponse: {
                chainId: MOCK_CHAIN_ID_MAINNET,
                from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                permission: {
                  type: 'native-token-stream',
                  isAdjustmentAllowed: false,
                  data: {
                    maxAmount: '0x22b1c8c1227a0000',
                    initialAmount: '0x6f05b59d3b20000',
                    amountPerSecond: '0x6f05b59d3b20000',
                    startTime: 1747699200,
                    justification: JUSTIFICATION,
                  },
                },
                context: '0x00000000',
                delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
              },
              siteOrigin: 'http://localhost:8000',
            },
          ],
          isFetchingGatorPermissions: false,
          pendingRevocations: [],
          lastSyncedTimestamp: -1,
        },
      };
      const result = getGatorPermissionCountByChain(
        stateWithPartial,
        TOKEN_TRANSFER_GROUP,
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        chainId: MOCK_CHAIN_ID_MAINNET,
        count: 1,
      });
    });
  });

  describe('getGatorPermissionCount', () => {
    describe('token-transfer group', () => {
      it('should return the correct count for token-transfer with all permission types', () => {
        const result = getGatorPermissionCount(mockState, TOKEN_TRANSFER_GROUP);
        // we have 2 chains for mock data in  state (mainnet + polygon), so: (1+1) + (1+1) + (1+1) + (0+0) = 6
        expect(result).toBe(6);
      });

      it('should return 0 when no permissions exist', () => {
        const emptyState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({}),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionCount(
          emptyState,
          TOKEN_TRANSFER_GROUP,
        );
        expect(result).toBe(0);
      });

      it('should handle different counts across chains correctly', () => {
        const customConfig = {
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
        };

        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions(customConfig),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionCount(
          customState,
          TOKEN_TRANSFER_GROUP,
        );
        expect(result).toBe(9);
      });
    });

    describe('unknown aggregated permission type', () => {
      it('should return 0 for unknown permission type', () => {
        const result = getGatorPermissionCount(mockState, []);

        expect(result).toBe(0);
      });

      it('should return 0 for empty string permission type', () => {
        const result = getGatorPermissionCount(mockState, []);

        expect(result).toBe(0);
      });
    });
  });

  describe('getGatorPermissionCountByChain (all origins)', () => {
    describe('token-transfer permission group', () => {
      it('should return correct permission group details for token-transfer with all permission types', () => {
        const result = getGatorPermissionCountByChain(
          mockState,
          TOKEN_TRANSFER_GROUP,
        );

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
            grantedPermissions: buildMockGrantedPermissions({}),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionCountByChain(
          emptyState,
          TOKEN_TRANSFER_GROUP,
        );
        expect(result).toEqual([]);
      });

      it('should handle different counts across chains correctly', () => {
        const customConfig = {
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
        };

        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions(customConfig),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionCountByChain(
          customState,
          TOKEN_TRANSFER_GROUP,
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
        const nativeOnlyConfig = {
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
        };

        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions(nativeOnlyConfig),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionCountByChain(
          customState,
          TOKEN_TRANSFER_GROUP,
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
        const erc20OnlyConfig = {
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
        };

        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions(erc20OnlyConfig),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionCountByChain(
          customState,
          TOKEN_TRANSFER_GROUP,
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
        const mixedConfig = {
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
        };

        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions(mixedConfig),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionCountByChain(
          customState,
          TOKEN_TRANSFER_GROUP,
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
        const result = getGatorPermissionCountByChain(mockState, []);
        expect(result).toEqual([]);
      });
    });

    describe('edge cases', () => {
      it('should handle single chain with permissions', () => {
        const singleChainConfig = {
          [MOCK_CHAIN_ID_MAINNET]: {
            nativeTokenStream: 2,
            nativeTokenPeriodic: 1,
            erc20TokenStream: 1,
            siteOrigin: 'http://localhost:8000',
          },
        };

        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions(singleChainConfig),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionCountByChain(
          customState,
          TOKEN_TRANSFER_GROUP,
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
        const multiChainConfig = {
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
        };

        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions(multiChainConfig),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionCountByChain(
          customState,
          TOKEN_TRANSFER_GROUP,
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

  describe('getGatorPermissionSummaryByOrigin', () => {
    describe('token transfer permissions by origin', () => {
      it('should return correct token transfer details for a site origin with permissions', () => {
        const result = getGatorPermissionSummaryByOrigin(
          mockState,
          'http://localhost:8000',
          TOKEN_TRANSFER_GROUP,
        );

        expect(result).toEqual({
          count: 3,
          chains: [MOCK_CHAIN_ID_MAINNET],
        });
      });

      it('should return correct token transfer details for different site origin', () => {
        const result = getGatorPermissionSummaryByOrigin(
          mockState,
          'http://localhost:8001',
          TOKEN_TRANSFER_GROUP,
        );

        expect(result).toEqual({
          count: 3,
          chains: [MOCK_CHAIN_ID_POLYGON],
        });
      });

      it('should return empty details for site origin with no permissions', () => {
        const result = getGatorPermissionSummaryByOrigin(
          mockState,
          'https://nonexistent.com',
          TOKEN_TRANSFER_GROUP,
        );

        expect(result).toEqual({
          count: 0,
          chains: [],
        });
      });

      it('should handle case-insensitive site origin matching', () => {
        const result = getGatorPermissionSummaryByOrigin(
          mockState,
          'HTTP://LOCALHOST:8000',
          TOKEN_TRANSFER_GROUP,
        );

        expect(result).toEqual({
          count: 3,
          chains: [MOCK_CHAIN_ID_MAINNET],
        });
      });

      it('should aggregate permissions across multiple chains for same origin', () => {
        const customConfig = {
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
        };

        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions(customConfig),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionSummaryByOrigin(
          customState,
          'http://example.com',
          TOKEN_TRANSFER_GROUP,
        );

        expect(result).toEqual({
          count: 7,
          chains: [MOCK_CHAIN_ID_MAINNET, MOCK_CHAIN_ID_POLYGON],
        });
      });

      it('should handle empty grantedPermissions', () => {
        const emptyState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({}),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionSummaryByOrigin(
          emptyState,
          'http://localhost:8000',
          TOKEN_TRANSFER_GROUP,
        );

        expect(result).toEqual({
          count: 0,
          chains: [],
        });
      });
    });

    describe('URL encoding handling', () => {
      it('should handle encoded site origin matching', () => {
        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 1,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 1,
                siteOrigin: 'https://example.com',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionSummaryByOrigin(
          customState,
          encodeURIComponent('https://example.com'),
          TOKEN_TRANSFER_GROUP,
        );

        expect(result.count).toBe(3);
        expect(result.chains).toEqual([MOCK_CHAIN_ID_MAINNET]);
      });

      it('should handle decoded site origin matching', () => {
        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 1,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 1,
                siteOrigin: 'https://example.com/path%20with%20spaces',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionSummaryByOrigin(
          customState,
          'https://example.com/path with spaces',
          TOKEN_TRANSFER_GROUP,
        );

        expect(result.count).toBe(3);
        expect(result.chains).toEqual([MOCK_CHAIN_ID_MAINNET]);
      });

      it('should handle malformed URI components without throwing', () => {
        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 1,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 1,
                siteOrigin: 'https://example.com',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        // Test with malformed URI that would cause decodeURIComponent to throw
        expect(() => {
          getGatorPermissionSummaryByOrigin(
            customState,
            '%E0%A4%A',
            TOKEN_TRANSFER_GROUP,
          );
        }).not.toThrow();

        // Test with empty string
        const emptyResult = getGatorPermissionSummaryByOrigin(
          customState,
          '',
          TOKEN_TRANSFER_GROUP,
        );
        expect(emptyResult.count).toBe(0);
      });
    });
  });

  describe('getGatorPermissionsByOrigin', () => {
    describe('token transfer permissions by origin', () => {
      it('should return correct permissions for a site origin with permissions', () => {
        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 2,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 1,
                siteOrigin: 'http://localhost:8000',
              },
              [MOCK_CHAIN_ID_POLYGON]: {
                nativeTokenStream: 1,
                nativeTokenPeriodic: 0,
                erc20TokenStream: 1,
                siteOrigin: 'http://localhost:8000',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionsByOrigin(
          customState,
          'http://localhost:8000',
          TOKEN_TRANSFER_GROUP,
        );

        expect(result.length).toBe(6);
        expect(
          result.every((perm) => perm.siteOrigin === 'http://localhost:8000'),
        ).toBe(true);
      });

      it('should return empty array for site origin with no permissions', () => {
        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 1,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 1,
                siteOrigin: 'http://localhost:8000',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionsByOrigin(
          customState,
          'http://different-origin.com',
          TOKEN_TRANSFER_GROUP,
        );

        expect(result).toEqual([]);
      });

      it('should handle case-insensitive site origin matching', () => {
        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 1,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 1,
                siteOrigin: 'http://Example.COM',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionsByOrigin(
          customState,
          'http://example.com',
          TOKEN_TRANSFER_GROUP,
        );

        expect(result.length).toBe(3);
      });

      it('should aggregate permissions across multiple chains for same origin', () => {
        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 2,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 0,
                siteOrigin: 'http://localhost:8000',
              },
              [MOCK_CHAIN_ID_POLYGON]: {
                nativeTokenStream: 0,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 2,
                siteOrigin: 'http://localhost:8000',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionsByOrigin(
          customState,
          'http://localhost:8000',
          TOKEN_TRANSFER_GROUP,
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

      it('should handle empty grantedPermissions', () => {
        const emptyState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({}),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionsByOrigin(
          emptyState,
          'http://localhost:8000',
          TOKEN_TRANSFER_GROUP,
        );

        expect(result).toEqual([]);
      });
    });

    describe('URL encoding handling', () => {
      it('should handle encoded site origin matching', () => {
        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 1,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 1,
                siteOrigin: 'https://example.com',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionsByOrigin(
          customState,
          encodeURIComponent('https://example.com'),
          TOKEN_TRANSFER_GROUP,
        );

        expect(result.length).toBe(3);
      });

      it('should handle decoded site origin matching', () => {
        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 1,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 1,
                siteOrigin: 'https://example.com/path%20with%20spaces',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionsByOrigin(
          customState,
          'https://example.com/path with spaces',
          TOKEN_TRANSFER_GROUP,
        );

        expect(result.length).toBe(3);
      });

      it('should handle malformed URI components without throwing', () => {
        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 1,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 1,
                siteOrigin: 'https://example.com',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        // Test with malformed URI that would cause decodeURIComponent to throw
        expect(() => {
          getGatorPermissionsByOrigin(
            customState,
            '%E0%A4%A',
            TOKEN_TRANSFER_GROUP,
          );
        }).not.toThrow();
      });
    });
  });

  describe('getGatorPermissionsForChain', () => {
    it('should return aggregated token-transfer permissions for a given chainId', () => {
      const result = getGatorPermissionsForChain(
        mockState,
        MOCK_CHAIN_ID_MAINNET,
        TOKEN_TRANSFER_GROUP,
      );

      expect(result).toHaveLength(3);

      const permissionTypes = result.map(
        (permission: PermissionInfoWithMetadata) =>
          permission.permissionResponse.permission.type,
      );
      expect(permissionTypes).toContain('native-token-stream');
      expect(permissionTypes).toContain('erc20-token-stream');
      expect(permissionTypes).toContain('native-token-periodic');
    });

    it('should return permissions sorted by startTime in ascending order', () => {
      const mockStateWithSortedPermissions: AppState = {
        metamask: {
          grantedPermissions: [
            {
              permissionResponse: {
                chainId: MOCK_CHAIN_ID_MAINNET as Hex,
                from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                permission: {
                  type: 'erc20-token-stream',
                  isAdjustmentAllowed: false,
                  data: {
                    initialAmount: '0x22b1c8c1227a0000',
                    maxAmount: '0x6f05b59d3b20000',
                    amountPerSecond: '0x6f05b59d3b20000',
                    startTime: 1747699100, // Earliest
                    tokenAddress: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                    justification: 'Test justification',
                  },
                },
                context: '0x00000000',
                delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
              },
              siteOrigin: 'http://localhost:8000',
            },
            {
              permissionResponse: {
                chainId: MOCK_CHAIN_ID_MAINNET as Hex,
                from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                permission: {
                  type: 'native-token-periodic',
                  isAdjustmentAllowed: false,
                  data: {
                    periodAmount: '0x22b1c8c1227a0000',
                    periodDuration: 1747699200,
                    startTime: 1747699200, // Middle
                    justification: 'Test justification',
                  },
                },
                context: '0x00000000',
                delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
              },
              siteOrigin: 'http://localhost:8000',
            },
            {
              permissionResponse: {
                chainId: MOCK_CHAIN_ID_MAINNET as Hex,
                from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                permission: {
                  type: 'native-token-stream',
                  isAdjustmentAllowed: false,
                  data: {
                    maxAmount: '0x22b1c8c1227a0000',
                    initialAmount: '0x6f05b59d3b20000',
                    amountPerSecond: '0x6f05b59d3b20000',
                    startTime: 1747699300, // Latest
                    justification: 'Test justification',
                  },
                },
                context: '0x00000000',
                delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
              },
              siteOrigin: 'http://localhost:8000',
            },
          ],
          isFetchingGatorPermissions: false,
          pendingRevocations: [],
          lastSyncedTimestamp: -1,
        },
      };

      const result = getGatorPermissionsForChain(
        mockStateWithSortedPermissions,
        MOCK_CHAIN_ID_MAINNET,
        TOKEN_TRANSFER_GROUP,
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
      const mockStateWithUndefinedStartTime: AppState = {
        metamask: {
          grantedPermissions: [
            {
              permissionResponse: {
                chainId: MOCK_CHAIN_ID_MAINNET as Hex,
                from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                permission: {
                  type: 'erc20-token-stream',
                  isAdjustmentAllowed: false,
                  data: {
                    initialAmount: '0x22b1c8c1227a0000',
                    maxAmount: '0x6f05b59d3b20000',
                    amountPerSecond: '0x6f05b59d3b20000',
                    // No startTime - should be placed first
                    tokenAddress: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                    justification: 'Test justification',
                  },
                },
                context: '0x00000000',
                delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
              },
              siteOrigin: 'http://localhost:8000',
            },
            {
              permissionResponse: {
                chainId: MOCK_CHAIN_ID_MAINNET as Hex,
                from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                permission: {
                  type: 'native-token-stream',
                  isAdjustmentAllowed: false,
                  data: {
                    maxAmount: '0x22b1c8c1227a0000',
                    initialAmount: '0x6f05b59d3b20000',
                    amountPerSecond: '0x6f05b59d3b20000',
                    startTime: 1747699200, // Has startTime
                    justification: 'Test justification',
                  },
                },
                context: '0x00000000',
                delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
              },
              siteOrigin: 'http://localhost:8000',
            },
          ],
          isFetchingGatorPermissions: false,
          pendingRevocations: [],
          lastSyncedTimestamp: -1,
        },
      };

      const result = getGatorPermissionsForChain(
        mockStateWithUndefinedStartTime,
        MOCK_CHAIN_ID_MAINNET,
        TOKEN_TRANSFER_GROUP,
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
      const result = getGatorPermissionsForChain(
        mockState,
        MOCK_CHAIN_ID_POLYGON,
        TOKEN_TRANSFER_GROUP,
      );

      expect(result).toHaveLength(3);

      const permissionTypes = result.map(
        (permission: PermissionInfoWithMetadata) =>
          permission.permissionResponse.permission.type,
      );
      expect(permissionTypes).toContain('native-token-stream');
      expect(permissionTypes).toContain('erc20-token-stream');
      expect(permissionTypes).toContain('native-token-periodic');
    });

    it('should return empty array for non-existent chainId', () => {
      const result = getGatorPermissionsForChain(
        mockState,
        '0x1111111111111111111111111111111111111111' as Hex,
        TOKEN_TRANSFER_GROUP,
      );

      expect(result).toEqual([]);
    });

    it('should return empty array for unknown aggregated permission type', () => {
      const result = getGatorPermissionsForChain(
        mockState,
        MOCK_CHAIN_ID_MAINNET,
        [], // unknown / empty group
      );

      expect(result).toEqual([]);
    });

    it('should handle state with only some permission types populated', () => {
      const mockStateWithPartialPermissions: AppState = {
        metamask: {
          grantedPermissions: [
            {
              permissionResponse: {
                chainId: MOCK_CHAIN_ID_MAINNET as Hex,
                from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
                permission: {
                  type: 'native-token-stream',
                  isAdjustmentAllowed: false,
                  data: {
                    maxAmount: '0x22b1c8c1227a0000',
                    initialAmount: '0x6f05b59d3b20000',
                    amountPerSecond: '0x6f05b59d3b20000',
                    startTime: 1747699200,
                    justification: 'Test justification',
                  },
                },
                context: '0x00000000',
                delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
              },
              siteOrigin: 'http://localhost:8000',
            },
          ],
          isFetchingGatorPermissions: false,
          pendingRevocations: [],
          lastSyncedTimestamp: -1,
        },
      };

      const result = getGatorPermissionsForChain(
        mockStateWithPartialPermissions,
        MOCK_CHAIN_ID_MAINNET,
        TOKEN_TRANSFER_GROUP,
      );

      expect(result).toHaveLength(1);
      expect(result[0].permissionResponse.permission.type).toBe(
        'native-token-stream',
      );
    });

    it('should handle state with empty permission arrays', () => {
      const mockStateWithEmptyPermissions = {
        metamask: {
          grantedPermissions: buildMockGrantedPermissions({}),
          isFetchingGatorPermissions: false,
          pendingRevocations: [],
          lastSyncedTimestamp: -1,
        },
      };

      const result = getGatorPermissionsForChain(
        mockStateWithEmptyPermissions,
        MOCK_CHAIN_ID_MAINNET,
        TOKEN_TRANSFER_GROUP,
      );

      expect(result).toEqual([]);
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
      const permissionsForGroup = [
        { siteOrigin: 'http://localhost:8000' },
        { siteOrigin: 'http://localhost:8000' },
        { siteOrigin: 'http://localhost:8000' },
        { siteOrigin: 'http://localhost:8001' },
        { siteOrigin: 'http://localhost:8001' },
      ] as PermissionInfoWithMetadata[];

      const result = getMergedConnectionsListWithGatorPermissions.resultFunc(
        sitesConnectionsList,
        permissionsForGroup,
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

  describe('getGatorPermissionCountByChain (by origin)', () => {
    describe('token-transfer permission group', () => {
      it('should return correct metadata filtered by origin', () => {
        const multiOriginConfig = {
          [MOCK_CHAIN_ID_MAINNET]: {
            nativeTokenStream: 2,
            nativeTokenPeriodic: 1,
            erc20TokenStream: 1,
            siteOrigin: 'https://example.com',
          },
          [MOCK_CHAIN_ID_POLYGON]: {
            nativeTokenStream: 1,
            nativeTokenPeriodic: 0,
            erc20TokenStream: 1,
            siteOrigin: 'https://example.com',
          },
        };

        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions(multiOriginConfig),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionCountByChain(
          customState,
          TOKEN_TRANSFER_GROUP,
          'https://example.com',
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

      it('should return empty array when no permissions match the origin', () => {
        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 2,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 1,
                siteOrigin: 'https://example.com',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionCountByChain(
          customState,
          TOKEN_TRANSFER_GROUP,
          'https://different-origin.com',
        );

        expect(result).toEqual([]);
      });

      it('should handle URL-encoded origins correctly', () => {
        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 1,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 1,
                siteOrigin: 'https://example.com',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionCountByChain(
          customState,
          TOKEN_TRANSFER_GROUP,
          encodeURIComponent('https://example.com'),
        );

        expect(result).toEqual([
          {
            chainId: MOCK_CHAIN_ID_MAINNET,
            count: 3,
          },
        ]);
      });

      it('should filter out permissions from other origins', () => {
        const grantedPermissions: PermissionInfoWithMetadata[] = [
          {
            permissionResponse: {
              chainId: MOCK_CHAIN_ID_MAINNET,
              from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
              permission: {
                type: 'native-token-stream',
              } as NativeTokenStreamPermission,
              context: '0x00000000',
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
            siteOrigin: 'https://example.com',
          },
          {
            permissionResponse: {
              chainId: MOCK_CHAIN_ID_MAINNET,
              from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
              permission: {
                type: 'native-token-stream',
              } as NativeTokenStreamPermission,
              context: '0x00000001',
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
            siteOrigin: 'https://other-origin.com',
          },
        ];

        const customState = {
          metamask: {
            grantedPermissions,
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionCountByChain(
          customState,
          TOKEN_TRANSFER_GROUP,
          'https://example.com',
        );

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
        const result = getGatorPermissionCountByChain(
          mockState,
          [], // unknown / empty group
          'https://example.com',
        );

        expect(result).toEqual([]);
      });
    });
  });

  describe('getGatorPermissionsForChain (by origin)', () => {
    describe('token-transfer aggregated permission type', () => {
      it('should return permissions filtered by chainId and origin', () => {
        const grantedPermissions: PermissionInfoWithMetadata[] = [
          {
            permissionResponse: {
              chainId: MOCK_CHAIN_ID_MAINNET,
              from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
              permission: {
                type: 'native-token-stream',
              } as NativeTokenStreamPermission,
              context: '0x00000000',
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
            siteOrigin: 'https://example.com',
          },
          {
            permissionResponse: {
              chainId: MOCK_CHAIN_ID_MAINNET,
              from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
              permission: {
                type: 'native-token-stream',
              } as NativeTokenStreamPermission,
              context: '0x00000001',
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
            siteOrigin: 'https://other-origin.com',
          },
          {
            permissionResponse: {
              chainId: MOCK_CHAIN_ID_MAINNET,
              from: '0xB68c70159E9892DdF5659ec42ff9BD2bbC23e778',
              permission: {
                type: 'native-token-periodic',
              } as NativeTokenPeriodicPermission,
              context: '0x00000002',
              delegationManager: '0xdb9B1e94B5b69Df7e401DDbedE43491141047dB3',
            },
            siteOrigin: 'https://example.com',
          },
        ];

        const customState = {
          metamask: {
            grantedPermissions,
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionsForChain(
          customState,
          MOCK_CHAIN_ID_MAINNET,
          TOKEN_TRANSFER_GROUP,
          'https://example.com',
        );

        expect(result).toHaveLength(2);
        expect(result[0].siteOrigin).toBe('https://example.com');
        expect(result[1].siteOrigin).toBe('https://example.com');
      });

      it('should return empty array when no permissions match the origin', () => {
        const result = getGatorPermissionsForChain(
          mockState,
          MOCK_CHAIN_ID_MAINNET,
          TOKEN_TRANSFER_GROUP,
          'https://non-existent-origin.com',
        );

        expect(result).toEqual([]);
      });

      it('should handle URL-encoded origins correctly', () => {
        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 1,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 1,
                siteOrigin: 'https://example.com',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionsForChain(
          customState,
          MOCK_CHAIN_ID_MAINNET,
          TOKEN_TRANSFER_GROUP,
          encodeURIComponent('https://example.com'),
        );

        expect(result).toHaveLength(3);
        result.forEach((permission) => {
          expect(permission.siteOrigin).toBe('https://example.com');
        });
      });

      it('should return only permissions for the specified chainId', () => {
        const multiChainConfig = {
          [MOCK_CHAIN_ID_MAINNET]: {
            nativeTokenStream: 2,
            nativeTokenPeriodic: 1,
            erc20TokenStream: 1,
            siteOrigin: 'https://example.com',
          },
          [MOCK_CHAIN_ID_POLYGON]: {
            nativeTokenStream: 3,
            nativeTokenPeriodic: 2,
            erc20TokenStream: 1,
            siteOrigin: 'https://example.com',
          },
        };

        const customState = {
          metamask: {
            grantedPermissions: buildMockGrantedPermissions(multiChainConfig),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        const result = getGatorPermissionsForChain(
          customState,
          MOCK_CHAIN_ID_MAINNET,
          TOKEN_TRANSFER_GROUP,
          'https://example.com',
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
            grantedPermissions: buildMockGrantedPermissions({
              [MOCK_CHAIN_ID_MAINNET]: {
                nativeTokenStream: 1,
                nativeTokenPeriodic: 1,
                erc20TokenStream: 1,
                siteOrigin: 'https://example.com',
              },
            }),
            isFetchingGatorPermissions: false,
            pendingRevocations: [],
            lastSyncedTimestamp: -1,
          },
        };

        // Test with malformed URI that would cause decodeURIComponent to throw
        expect(() => {
          getGatorPermissionsForChain(
            customState,
            MOCK_CHAIN_ID_MAINNET,
            TOKEN_TRANSFER_GROUP,
            '%E0%A4%A',
          );
        }).not.toThrow();
      });
    });

    describe('unknown aggregated permission type', () => {
      it('should return empty array for unknown permission type', () => {
        const result = getGatorPermissionsForChain(
          mockState,
          MOCK_CHAIN_ID_MAINNET,
          [], // unknown / empty group
          'https://example.com',
        );

        expect(result).toEqual([]);
      });
    });
  });
});
