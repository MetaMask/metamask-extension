import { createSelector } from 'reselect';
import {
  SupportedGatorPermissionType,
  GatorPermissionsMap,
  deserializeGatorPermissionsMap,
  GatorPermissionsControllerState,
  StoredGatorPermissionSanitized,
  GatorPermissionsMapByPermissionType,
  PermissionTypesWithCustom,
  Signer,
} from '@metamask/gator-permissions-controller';
import { Hex } from '@metamask/utils';
import { isSnapId } from '@metamask/snaps-utils';
import { SubjectType } from '@metamask/permission-controller';
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import { safeDecodeURIComponent } from '../../components/multichain/pages/gator-permissions/helper';
import {
  getConnectedSitesListWithNetworkInfo,
  getTargetSubjectMetadata,
} from '../selectors';
import { getURLHostName } from '../../helpers/utils/util';

export type AppState = {
  metamask: GatorPermissionsControllerState;
};

export type PermissionsGroupMetaDataByChainId = Record<Hex, number>; // chainId -> count

export type PermissionsGroupMetaData = {
  chainId: Hex;
  count: number;
};

export type MetDataByPermissionTypeGroup = Record<
  'tokenTransfer',
  {
    count: number;
    chains: Hex[];
  }
>;

export enum GatorSortOrder {
  Ascending = 'asc',
  Descending = 'desc',
}
export type ConnectionInfo = {
  addresses: string[];
  addressToNameMap?: Record<string, string>;
  origin: string;
  name: string;
  iconUrl: string | null;
  subjectType: SubjectType;
  networkIconUrl: string;
  networkName: string;
  extensionId: string | null;
  svgIcon?: string;
  version?: string;
  advancedPermissionsCount?: number;
};

const TOKEN_TRANSFER_PERMISSION_TYPES: SupportedGatorPermissionType[] = [
  'native-token-stream',
  'erc20-token-stream',
  'native-token-periodic',
  'erc20-token-periodic',
  'erc20-token-revocation',
];

const getMetamask = (state: AppState) => state.metamask;

/**
 * Sort gator permissions by startTime.
 * Permissions without startTime are placed at the beginning for ascending order,
 * or at the end for descending order.
 *
 * @param permissions - Array of gator permissions to sort
 * @param order - Sort order: GatorSortOrder.Ascending for oldest first, GatorSortOrder.Descending for newest first. Defaults to GatorSortOrder.Ascending
 * @returns Sorted array of gator permissions
 */
function sortGatorPermissionsByStartTime<
  TPermission extends StoredGatorPermissionSanitized<
    Signer,
    PermissionTypesWithCustom
  >,
>(
  permissions: TPermission[],
  order: GatorSortOrder = GatorSortOrder.Ascending,
): TPermission[] {
  return [...permissions].sort((a, b) => {
    const aStartTime = a.permissionResponse.permission.data?.startTime as
      | number
      | undefined;
    const bStartTime = b.permissionResponse.permission.data?.startTime as
      | number
      | undefined;

    // Both undefined - maintain original order
    if (!aStartTime && !bStartTime) {
      return 0;
    }

    // Only a is undefined
    if (!aStartTime) {
      return order === GatorSortOrder.Ascending ? -1 : 1;
    }

    // Only b is undefined
    if (!bStartTime) {
      return order === GatorSortOrder.Ascending ? 1 : -1;
    }

    // Both have values - sort based on order
    return order === GatorSortOrder.Ascending
      ? aStartTime - bStartTime
      : bStartTime - aStartTime;
  });
}

/**
 * Get gator permissions map from GatorPermissionsController.
 *
 * @param state - The current state
 * @returns Gator permissions map
 * @example
 * const gatorPermissionsMap = getGatorPermissionsMap(state);
 *
 * // {
 * //   'native-token-stream': {
 * //     '0x1': [permission1, permission2],
 * //     '0x89': [permission3, permission4],
 * //   },
 * //   'native-token-periodic': {
 * //     '0x1': [permission5, permission6],
 * //     '0x89': [permission7, permission8],
 * //   },
 * //   ...
 * // }
 */
export const getGatorPermissionsMap = createSelector(
  [getMetamask],
  (metamask) =>
    deserializeGatorPermissionsMap(metamask.gatorPermissionsMapSerialized),
);

/**
 * Get the count of gator permissions for a specific permission type across all chains.
 *
 * @param gatorPermissionsMap - The gator permissions map
 * @param permissionType - The permission type to get permissions for (e.g. 'native-token-stream')
 * @returns The count of gator permissions for the permission type across all chains
 */
function getGatorPermissionsCountAcrossAllChainsByPermissionType(
  gatorPermissionsMap: GatorPermissionsMap,
  permissionType: SupportedGatorPermissionType,
): number {
  // check if any undefined values are present
  const allPermissionsAcrossAllChains = Object.values(
    gatorPermissionsMap[permissionType],
  ).flat();
  for (const gatorPermission of allPermissionsAcrossAllChains) {
    if (!gatorPermission) {
      throw new Error(
        `Undefined values present in the gatorPermissionsMap for permission type: ${permissionType}`,
      );
    }
  }

  return allPermissionsAcrossAllChains.length;
}

/**
 * Get aggregated list of gator permissions for all chains.
 *
 * @param _state - The current state
 * @param aggregatedPermissionType - The aggregated permission type to get permissions for (e.g. 'token-transfer' is a combination of the token streams and token subscriptions types)
 * @returns A aggregated list of gator permissions count.
 */
export const getAggregatedGatorPermissionsCountAcrossAllChains = createSelector(
  [
    getGatorPermissionsMap,
    (_state: AppState, aggregatedPermissionType: string) =>
      aggregatedPermissionType,
  ],
  (gatorPermissionsMap, aggregatedPermissionType) => {
    switch (aggregatedPermissionType) {
      case 'token-transfer': {
        return TOKEN_TRANSFER_PERMISSION_TYPES.reduce(
          (total, permissionType) => {
            return (
              total +
              getGatorPermissionsCountAcrossAllChainsByPermissionType(
                gatorPermissionsMap,
                permissionType,
              )
            );
          },
          0,
        );
      }
      default: {
        return 0;
      }
    }
  },
);

/**
 * Merge two records of chainId to total count of gator permissions.
 *
 * @param record1 - The first record to merge
 * @param record2 - The second record to merge
 * @returns A merged record of chainId to total count of gator permissions
 */
function mergePermissionsGroupMetaDataByChainId(
  record1: PermissionsGroupMetaDataByChainId,
  record2: PermissionsGroupMetaDataByChainId,
): PermissionsGroupMetaDataByChainId {
  const mergedRecord = { ...record1 };

  for (const [key, value] of Object.entries(record2)) {
    mergedRecord[key as Hex] = (mergedRecord[key as Hex] || 0) + value;
  }

  return mergedRecord;
}

/**
 * Get the total count of gator permissions of a specific permission type across chains.
 *
 * @param permissionsMapByPermissionType - The map of gator permissions by permission type
 * @returns A record of chainId to total count of gator permissions
 */
function getTotalCountOfGatorPermissionsPerChainId(
  permissionsMapByPermissionType: GatorPermissionsMapByPermissionType<SupportedGatorPermissionType>,
): PermissionsGroupMetaDataByChainId {
  const flattenedGatorPermissionsAcrossAllChains: StoredGatorPermissionSanitized<
    Signer,
    PermissionTypesWithCustom
  >[] = Object.values(permissionsMapByPermissionType).flat();

  const permissionsGroupDetailRecord: PermissionsGroupMetaDataByChainId = {};
  return flattenedGatorPermissionsAcrossAllChains.reduce(
    (acc, gatorPermission) => {
      const { permissionResponse } = gatorPermission;
      acc[permissionResponse.chainId] =
        (acc[permissionResponse.chainId] || 0) + 1;
      return acc;
    },
    permissionsGroupDetailRecord,
  );
}

/**
 * Get gator permissions group details.
 *
 * @param _state - The current state
 * @param permissionGroupName - The type of list to get (token-transfer, spending-cap, nft, custom, etc.)
 * @returns A list of gator permissions group details.
 * @example
 * const permissionGroupMetaData = getPermissionsGroupMetaData(state, 'token-transfer');
 *
 * // [{
 * //   chainId: '0x1',
 * //   count: 2,
 * // },
 * // {
 * //   chainId: '0x89',
 * //   count: 2,
 * // }
 * ]
 */
export const getPermissionGroupMetaData = createSelector(
  [
    getGatorPermissionsMap,
    (_state: AppState, permissionGroupName: string) => permissionGroupName,
  ],
  (gatorPermissionsMap, permissionGroupName): PermissionsGroupMetaData[] => {
    switch (permissionGroupName) {
      case 'token-transfer': {
        const totalPermissionsCountPerChainId =
          TOKEN_TRANSFER_PERMISSION_TYPES.reduce((acc, permissionType) => {
            return mergePermissionsGroupMetaDataByChainId(
              acc,
              getTotalCountOfGatorPermissionsPerChainId(
                gatorPermissionsMap[permissionType],
              ),
            );
          }, {} as PermissionsGroupMetaDataByChainId);

        return Object.entries(totalPermissionsCountPerChainId).map(
          ([chainId, count]) => ({
            chainId: chainId as Hex,
            count,
          }),
        );
      }
      default:
        return [];
    }
  },
);

/**
 * Filter gator permissions by site origin and type.
 *
 * @param gatorPermissionsMap - The gator permissions map
 * @param siteOrigin - The site origin to filter by (e.g., 'https://example.com')
 * @param permissionType - The permission type to filter by (e.g., 'native-token-stream')
 * @returns An array of gator permissions filtered by site origin and type
 */
const filterPermissionsByOriginAndType = (
  gatorPermissionsMap: GatorPermissionsMap,
  siteOrigin: string,
  permissionType: SupportedGatorPermissionType,
): StoredGatorPermissionSanitized<Signer, PermissionTypesWithCustom>[] => {
  if (!gatorPermissionsMap[permissionType]) {
    return [];
  }

  const decodedSiteOrigin = safeDecodeURIComponent(siteOrigin);
  return Object.values(gatorPermissionsMap[permissionType])
    .flat() // flatten array of arrays to get permission across all chains
    .filter((gatorPermission) => {
      if (!gatorPermission) {
        throw new Error(
          `Undefined values present in the gatorPermissionsMap for permission type: ${permissionType}`,
        );
      }

      return isEqualCaseInsensitive(
        safeDecodeURIComponent(gatorPermission.siteOrigin),
        decodedSiteOrigin,
      );
    });
};

/**
 * Get all token transfer permissions for a specific site origin (helper function).
 *
 * @param gatorPermissionsMap - The gator permissions map
 * @param siteOrigin - The site origin to filter by (e.g., 'https://example.com')
 * @returns An array of all token transfer permissions for the site origin
 */
const getTokenTransferPermissionsByOriginHelper = (
  gatorPermissionsMap: GatorPermissionsMap,
  siteOrigin: string,
): StoredGatorPermissionSanitized<Signer, PermissionTypesWithCustom>[] => {
  return TOKEN_TRANSFER_PERMISSION_TYPES.flatMap((permissionType) =>
    filterPermissionsByOriginAndType(
      gatorPermissionsMap,
      siteOrigin,
      permissionType,
    ),
  );
};

/**
 * Get token transfer permissions across all chains by site origin.
 *
 * @param gatorPermissionsMap - The gator permissions map
 * @param siteOrigin - The site origin to filter by (e.g., 'https://example.com')
 * @returns An object with the count and chains of token transfer permissions across all chains by site origin
 */
const getTokenTransferMetaDataByOrigin = (
  gatorPermissionsMap: GatorPermissionsMap,
  siteOrigin: string,
) => {
  const tokenTransferPermissions = getTokenTransferPermissionsByOriginHelper(
    gatorPermissionsMap,
    siteOrigin,
  );

  const tokenTransferChains = new Set(
    tokenTransferPermissions.map(
      (permission) => permission.permissionResponse.chainId,
    ),
  );

  return {
    count: tokenTransferPermissions.length,
    chains: Array.from(tokenTransferChains),
  };
};

/**
 * Get permission group details across all chains by site origin.
 *
 * @param _state - The current state
 * @param siteOrigin - The site origin to filter by (e.g., 'https://example.com')
 * @returns Object with counts and chain lists for permission group details across all chains by site origin
 * @example
 * const permissionGroupMetaData = getPermissionMetaDataByOrigin(state, 'https://example.com');
 *
 * // {
 * //   'tokenTransfer': {
 * //     'count': 3,
 * //     'chains': ['0x1', '0x89'],
 * //   },
 * // }
 */
export const getPermissionMetaDataByOrigin = createSelector(
  [
    getGatorPermissionsMap,
    (_state: AppState, siteOrigin: string) => siteOrigin,
  ],
  (gatorPermissionsMap, siteOrigin): MetDataByPermissionTypeGroup => {
    return {
      tokenTransfer: getTokenTransferMetaDataByOrigin(
        gatorPermissionsMap,
        siteOrigin,
      ),
    };
  },
);

/**
 * Get permission group metadata (count per chain) filtered by origin.
 *
 * @param _state - The current state
 * @param options - The options object
 * @param options.permissionGroupName - The permission group name (e.g. 'token-transfer')
 * @param options.siteOrigin - The site origin to filter by (e.g., 'https://example.com')
 * @returns A list of permission group metadata with counts per chain, filtered by origin
 * @example
 * const permissionGroupMetaData = getPermissionGroupMetaDataByOrigin(state, {
 *   permissionGroupName: 'token-transfer',
 *   siteOrigin: 'https://example.com'
 * });
 *
 * // [{
 * //   chainId: '0x1',
 * //   count: 2,
 * // },
 * // {
 * //   chainId: '0x89',
 * //   count: 1,
 * // }]
 */
export const getPermissionGroupMetaDataByOrigin = createSelector(
  [
    getGatorPermissionsMap,
    (
      _state: AppState,
      options: { permissionGroupName: string; siteOrigin: string },
    ) => options,
  ],
  (
    gatorPermissionsMap,
    { permissionGroupName, siteOrigin },
  ): PermissionsGroupMetaData[] => {
    if (permissionGroupName !== 'token-transfer') {
      return [];
    }

    // Get all token transfer permissions filtered by origin
    const tokenTransferPermissions = getTokenTransferPermissionsByOriginHelper(
      gatorPermissionsMap,
      siteOrigin,
    );

    // Count permissions per chain
    const countPerChain: Record<Hex, number> = {};
    tokenTransferPermissions.forEach((permission) => {
      const { chainId } = permission.permissionResponse;
      countPerChain[chainId] = (countPerChain[chainId] || 0) + 1;
    });

    // Convert to PermissionsGroupMetaData format
    return Object.entries(countPerChain).map(([chainId, count]) => ({
      chainId: chainId as Hex,
      count,
    }));
  },
);

/**
 * Get all token transfer permissions for a specific site origin sorted by start time.
 *
 * @param _state - The current state
 * @param siteOrigin - The site origin to filter by (e.g., 'https://example.com')
 * @returns Array of all token transfer permissions for the site origin, sorted by start time (oldest first)
 * @example
 * const permissions = getTokenTransferPermissionsByOrigin(state, 'https://example.com');
 *
 * // [
 * //   { permissionResponse: { chainId: '0x1', ... }, ... },
 * //   { permissionResponse: { chainId: '0x89', ... }, ... },
 * // ]
 */
export const getTokenTransferPermissionsByOrigin = createSelector(
  [
    getGatorPermissionsMap,
    (_state: AppState, siteOrigin: string) => siteOrigin,
  ],
  (
    gatorPermissionsMap,
    siteOrigin,
  ): StoredGatorPermissionSanitized<Signer, PermissionTypesWithCustom>[] => {
    const allPermissions = getTokenTransferPermissionsByOriginHelper(
      gatorPermissionsMap,
      siteOrigin,
    );
    return sortGatorPermissionsByStartTime(allPermissions);
  },
);

/**
 * Get unique site origins from token transfer gator permissions.
 *
 * @param state - The current state
 * @returns Array of unique site origins that have token transfer gator permissions
 * @example
 * const siteOrigins = getUniqueSiteOriginsFromTokenTransferPermissions(state);
 *
 * // ['https://example.com', 'https://another-site.com']
 */
export const getUniqueSiteOriginsFromTokenTransferPermissions = createSelector(
  [getGatorPermissionsMap],
  (gatorPermissionsMap): string[] => {
    const siteOrigins = TOKEN_TRANSFER_PERMISSION_TYPES.flatMap(
      (permissionType) => {
        const permissionsByChain = gatorPermissionsMap[permissionType];
        if (!permissionsByChain) {
          return [];
        }

        // Get all permissions across all chains for this permission type
        return Object.values(permissionsByChain).flat();
      },
    ).map((permission) => permission.siteOrigin);

    return [...new Set(siteOrigins)];
  },
);

/**
 * Get the count of gator permissions per site origin.
 *
 * @param state - The current state
 * @returns Map of site origin to permission count
 * @example
 * const permissionCounts = getGatorPermissionCountsBySiteOrigin(state);
 *
 * // Map { 'https://example.com' => 3, 'https://another-site.com' => 1 }
 */
export const getGatorPermissionCountsBySiteOrigin = createSelector(
  [getGatorPermissionsMap],
  (gatorPermissionsMap): Map<string, number> => {
    const sitePermissionCounts = new Map<string, number>();

    const allPermissions = Object.values(gatorPermissionsMap).flatMap(
      (permissionTypeMap) =>
        Object.values(permissionTypeMap).flatMap((permissions) => permissions),
    );

    allPermissions.forEach(
      (
        permission: StoredGatorPermissionSanitized<
          Signer,
          PermissionTypesWithCustom
        >,
      ) => {
        if (permission?.siteOrigin) {
          const currentCount =
            sitePermissionCounts.get(permission.siteOrigin) || 0;
          sitePermissionCounts.set(permission.siteOrigin, currentCount + 1);
        }
      },
    );

    return sitePermissionCounts;
  },
);

/**
 * Get the total count of unique sites (combining traditional connections and gator permissions).
 *
 * @param state - The current state
 * @returns Total number of unique sites
 * @example
 * const totalSites = getTotalUniqueSitesCount(state);
 *
 * // 5 (sites with connections or gator permissions, excluding snaps)
 */
export const getTotalUniqueSitesCount = createSelector(
  [
    getConnectedSitesListWithNetworkInfo,
    getUniqueSiteOriginsFromTokenTransferPermissions,
  ],
  (sitesConnectionsList, gatorPermissionSiteOrigins): number => {
    // Get unique site origins from site connections (excluding snaps)
    const connectedSiteOrigins = Object.keys(sitesConnectionsList).filter(
      (site) => !isSnapId(site),
    );

    // Combine both lists and get unique sites
    const allUniqueSites = new Set([
      ...connectedSiteOrigins,
      ...gatorPermissionSiteOrigins,
    ]);

    return allUniqueSites.size;
  },
);

/**
 * Get merged connections list that includes sites with both traditional connections
 * and gator permissions. Sites with only gator permissions will have minimal connection data.
 *
 * @param state - The current state
 * @returns Merged connections list object
 * @example
 * const connections = getMergedConnectionsListWithGatorPermissions(state);
 *
 * // {
 * //   'https://example.com': {
 * //     addresses: ['0x123'],
 * //     origin: 'https://example.com',
 * //     name: 'Example Site',
 * //     advancedPermissionsCount: 3,
 * //     ...
 * //   },
 * //   'https://gator-only.com': {
 * //     addresses: [],
 * //     origin: 'https://gator-only.com',
 * //     name: 'Gator Only Site',
 * //     advancedPermissionsCount: 2,
 * //     ...
 * //   }
 * // }
 */
export const getMergedConnectionsListWithGatorPermissions = createSelector(
  [
    getConnectedSitesListWithNetworkInfo,
    getGatorPermissionCountsBySiteOrigin,
    (state: AppState) => state,
  ],
  (sitesConnectionsList, gatorPermissionCounts, state) => {
    const mergedConnections: Record<string, ConnectionInfo> = {
      ...sitesConnectionsList,
    };

    gatorPermissionCounts.forEach((permissionCount, siteOrigin) => {
      if (mergedConnections[siteOrigin]) {
        // Site exists in both connections and gator permissions - add count
        mergedConnections[siteOrigin] = {
          ...mergedConnections[siteOrigin],
          advancedPermissionsCount: permissionCount,
        };
      } else {
        // Site only has gator permissions - create minimal entry
        const subjectMetadata = getTargetSubjectMetadata(state, siteOrigin);
        mergedConnections[siteOrigin] = {
          addresses: [],
          origin: siteOrigin,
          name: subjectMetadata?.name || getURLHostName(siteOrigin),
          iconUrl: subjectMetadata?.iconUrl || null,
          subjectType: SubjectType.Website,
          networkIconUrl: '',
          networkName: '',
          extensionId: null,
          advancedPermissionsCount: permissionCount,
        };
      }
    });

    return mergedConnections;
  },
);

/**
 * Get aggregated list of gator permissions for a specific chainId.
 *
 * @param _state - The current state
 * @param options - The options to get permissions for (e.g. { aggregatedPermissionType: 'token-transfer', chainId: '0x1' })
 * @param options.aggregatedPermissionType - The aggregated permission type to get permissions for (e.g. 'token-transfer' is a combination of the token streams and token subscriptions types)
 * @param options.chainId - The chainId to get permissions for (e.g. 0x1)
 * @returns A aggregated list of gator permissions filtered by chainId.
 */
export const getAggregatedGatorPermissionByChainId = createSelector(
  [
    getGatorPermissionsMap,
    (
      _state: AppState,
      options: { aggregatedPermissionType: string; chainId: Hex },
    ) => options,
  ],
  (
    gatorPermissionsMap,
    { aggregatedPermissionType, chainId },
  ): StoredGatorPermissionSanitized<Signer, PermissionTypesWithCustom>[] => {
    switch (aggregatedPermissionType) {
      case 'token-transfer': {
        const allPermissions = TOKEN_TRANSFER_PERMISSION_TYPES.flatMap(
          (permissionType) =>
            (gatorPermissionsMap[permissionType][chainId] ||
              []) as StoredGatorPermissionSanitized<
              Signer,
              PermissionTypesWithCustom
            >[],
        );
        return sortGatorPermissionsByStartTime(allPermissions);
      }
      default: {
        console.warn(
          `Unknown aggregated permission type: ${aggregatedPermissionType}`,
        );
        return [];
      }
    }
  },
);

/**
 * Get aggregated list of gator permissions for a specific chainId and origin.
 *
 * @param _state - The current state
 * @param options - The options to get permissions for
 * @param options.aggregatedPermissionType - The aggregated permission type (e.g. 'token-transfer')
 * @param options.chainId - The chainId to get permissions for (e.g. 0x1)
 * @param options.siteOrigin - The site origin to filter by (e.g., 'https://example.com')
 * @returns A aggregated list of gator permissions filtered by chainId and origin.
 */
export const getAggregatedGatorPermissionByChainIdAndOrigin = createSelector(
  [
    getGatorPermissionsMap,
    (
      _state: AppState,
      options: {
        aggregatedPermissionType: string;
        chainId: Hex;
        siteOrigin: string;
      },
    ) => options,
  ],
  (
    gatorPermissionsMap,
    { aggregatedPermissionType, chainId, siteOrigin },
  ): StoredGatorPermissionSanitized<Signer, PermissionTypesWithCustom>[] => {
    switch (aggregatedPermissionType) {
      case 'token-transfer': {
        const allPermissions = TOKEN_TRANSFER_PERMISSION_TYPES.flatMap(
          (permissionType) =>
            (gatorPermissionsMap[permissionType][chainId] ||
              []) as StoredGatorPermissionSanitized<
              Signer,
              PermissionTypesWithCustom
            >[],
        );

        // Filter by origin
        const decodedSiteOrigin = safeDecodeURIComponent(siteOrigin);
        const filteredPermissions = allPermissions.filter((permission) =>
          isEqualCaseInsensitive(
            safeDecodeURIComponent(permission.siteOrigin),
            decodedSiteOrigin,
          ),
        );
        return sortGatorPermissionsByStartTime(filteredPermissions);
      }
      default: {
        console.warn(
          `Unknown aggregated permission type: ${aggregatedPermissionType}`,
        );
        return [];
      }
    }
  },
);

/**
 * Get the list of gator permissions pending a revocation transaction.
 *
 * @param state - The current state
 * @returns The list of gator permissions pending a revocation transaction
 */
export const getPendingRevocations = createSelector(
  [getMetamask],
  (metamask) => metamask.pendingRevocations,
);
