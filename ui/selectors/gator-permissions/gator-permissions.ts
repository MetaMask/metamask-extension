import { createSelector } from 'reselect';
import {
  SupportedPermissionType,
  PermissionInfoWithMetadata,
  GatorPermissionsControllerState,
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

const TOKEN_TRANSFER_PERMISSION_TYPES: SupportedPermissionType[] = [
  'native-token-stream',
  'erc20-token-stream',
  'native-token-periodic',
  'erc20-token-periodic',
  'erc20-token-revocation',
];

/**
 * Permission type key used for custom permissions in the map structure.
 * Standard permission types use their type string directly.
 */
const CUSTOM_PERMISSION_MAP_KEY = 'other';

/**
 * All permission type keys expected in the GatorPermissionsMap structure.
 * Used to ensure consistent shape for backward compatibility.
 */
const GATOR_PERMISSIONS_MAP_KEYS: (
  | SupportedPermissionType
  | typeof CUSTOM_PERMISSION_MAP_KEY
)[] = [...TOKEN_TRANSFER_PERMISSION_TYPES, CUSTOM_PERMISSION_MAP_KEY];

/**
 * Map structure: permission type -> chainId -> permissions.
 * Maintained for backward compatibility with consumers expecting the legacy format.
 */
export type GatorPermissionsMap = Partial<
  Record<
    SupportedPermissionType | typeof CUSTOM_PERMISSION_MAP_KEY,
    Partial<Record<Hex, PermissionInfoWithMetadata[]>>
  >
>;

/**
 * Maps permission type from PermissionInfo to the GatorPermissionsMap key.
 * Custom permissions use 'other' key.
 * @param permissionType
 */
function getMapKeyForPermissionType(
  permissionType: string,
): SupportedPermissionType | typeof CUSTOM_PERMISSION_MAP_KEY {
  if (
    TOKEN_TRANSFER_PERMISSION_TYPES.includes(
      permissionType as SupportedPermissionType,
    )
  ) {
    return permissionType as SupportedPermissionType;
  }
  return CUSTOM_PERMISSION_MAP_KEY;
}

/**
 * Converts the flat grantedPermissions array into the legacy map structure.
 * Enables backward compatibility with selectors and hooks expecting GatorPermissionsMap.
 * @param permissions
 */
function grantedPermissionsToMap(
  permissions: PermissionInfoWithMetadata[],
): GatorPermissionsMap {
  const map: GatorPermissionsMap = {};
  for (const key of GATOR_PERMISSIONS_MAP_KEYS) {
    map[key] = {};
  }

  for (const permission of permissions) {
    const { type } = permission.permissionResponse.permission;
    const mapKey = getMapKeyForPermissionType(type);
    const { chainId } = permission.permissionResponse;

    if (!map[mapKey]) {
      map[mapKey] = {};
    }
    const chainMap = map[mapKey] as Record<Hex, PermissionInfoWithMetadata[]>;
    if (!chainMap[chainId]) {
      chainMap[chainId] = [];
    }
    chainMap[chainId].push(permission);
  }

  return map;
}

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

const getMetamask = (state: AppState) => state.metamask;

/**
 * Get the raw granted permissions array from state.
 * Base selector for array-based operations.
 */
const getGrantedPermissions = createSelector(
  [getMetamask],
  (metamask) => metamask.grantedPermissions ?? [],
);

/**
 * Filter permissions by token-transfer type, optionally by siteOrigin and/or chainId.
 * Shared utility for selectors that need token transfer permissions.
 * @param permissions
 * @param options
 * @param options.siteOrigin
 * @param options.chainId
 */
function filterTokenTransferPermissions(
  permissions: PermissionInfoWithMetadata[],
  options?: { siteOrigin?: string; chainId?: Hex },
): PermissionInfoWithMetadata[] {
  let filtered = permissions.filter((p) =>
    TOKEN_TRANSFER_PERMISSION_TYPES.includes(
      p.permissionResponse.permission.type as SupportedPermissionType,
    ),
  );

  if (options?.siteOrigin !== undefined && options.siteOrigin !== null) {
    const decodedOrigin = safeDecodeURIComponent(options.siteOrigin);
    filtered = filtered.filter((p) =>
      isEqualCaseInsensitive(
        safeDecodeURIComponent(p.siteOrigin),
        decodedOrigin,
      ),
    );
  }

  if (options?.chainId) {
    const { chainId } = options;

    filtered = filtered.filter((p) =>
      isEqualCaseInsensitive(p.permissionResponse.chainId, chainId),
    );
  }

  return filtered;
}

/**
 * Count permissions per chain and return as PermissionsGroupMetaData array.
 * @param permissions
 */
function countPermissionsByChain(
  permissions: PermissionInfoWithMetadata[],
): PermissionsGroupMetaData[] {
  const countPerChain: Record<Hex, number> = {};
  for (const p of permissions) {
    const { chainId } = p.permissionResponse;
    countPerChain[chainId] = (countPerChain[chainId] ?? 0) + 1;
  }
  return Object.entries(countPerChain).map(([chainId, count]) => ({
    chainId: chainId as Hex,
    count,
  }));
}

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
  TPermission extends PermissionInfoWithMetadata,
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
  (metamask) => grantedPermissionsToMap(metamask.grantedPermissions ?? []),
);

/**
 * Get aggregated list of gator permissions for all chains.
 *
 * @param _state - The current state
 * @param aggregatedPermissionType - The aggregated permission type to get permissions for (e.g. 'token-transfer' is a combination of the token streams and token subscriptions types)
 * @returns A aggregated list of gator permissions count.
 */
export const getAggregatedGatorPermissionsCountAcrossAllChains = createSelector(
  [
    getGrantedPermissions,
    (_state: AppState, aggregatedPermissionType: string) =>
      aggregatedPermissionType,
  ],
  (grantedPermissions, aggregatedPermissionType) => {
    switch (aggregatedPermissionType) {
      case 'token-transfer': {
        return filterTokenTransferPermissions(grantedPermissions).length;
      }
      default: {
        return 0;
      }
    }
  },
);

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
    getGrantedPermissions,
    (_state: AppState, permissionGroupName: string) => permissionGroupName,
  ],
  (grantedPermissions, permissionGroupName): PermissionsGroupMetaData[] => {
    switch (permissionGroupName) {
      case 'token-transfer': {
        return countPermissionsByChain(
          filterTokenTransferPermissions(grantedPermissions),
        );
      }
      default:
        return [];
    }
  },
);

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
  [getGrantedPermissions, (_state: AppState, siteOrigin: string) => siteOrigin],
  (grantedPermissions, siteOrigin): MetDataByPermissionTypeGroup => {
    const tokenTransferPermissions = filterTokenTransferPermissions(
      grantedPermissions,
      { siteOrigin },
    );
    const tokenTransferChains = [
      ...new Set(
        tokenTransferPermissions.map((p) => p.permissionResponse.chainId),
      ),
    ];
    return {
      tokenTransfer: {
        count: tokenTransferPermissions.length,
        chains: tokenTransferChains,
      },
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
    getGrantedPermissions,
    (
      _state: AppState,
      options: { permissionGroupName: string; siteOrigin: string },
    ) => options,
  ],
  (
    grantedPermissions,
    { permissionGroupName, siteOrigin },
  ): PermissionsGroupMetaData[] => {
    if (permissionGroupName !== 'token-transfer') {
      return [];
    }
    return countPermissionsByChain(
      filterTokenTransferPermissions(grantedPermissions, { siteOrigin }),
    );
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
  [getGrantedPermissions, (_state: AppState, siteOrigin: string) => siteOrigin],
  (grantedPermissions, siteOrigin): PermissionInfoWithMetadata[] => {
    const filtered = filterTokenTransferPermissions(grantedPermissions, {
      siteOrigin,
    });
    return sortGatorPermissionsByStartTime(filtered);
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
  [getGrantedPermissions],
  (grantedPermissions): string[] => {
    const tokenTransfer = filterTokenTransferPermissions(grantedPermissions);
    return [...new Set(tokenTransfer.map((p) => p.siteOrigin))];
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
  [getGrantedPermissions],
  (grantedPermissions): Map<string, number> => {
    const sitePermissionCounts = new Map<string, number>();
    for (const permission of grantedPermissions) {
      if (permission.siteOrigin) {
        const currentCount =
          sitePermissionCounts.get(permission.siteOrigin) ?? 0;
        sitePermissionCounts.set(permission.siteOrigin, currentCount + 1);
      }
    }
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
    getGrantedPermissions,
    (
      _state: AppState,
      options: { aggregatedPermissionType: string; chainId: Hex },
    ) => options,
  ],
  (
    grantedPermissions,
    { aggregatedPermissionType, chainId },
  ): PermissionInfoWithMetadata[] => {
    switch (aggregatedPermissionType) {
      case 'token-transfer': {
        const filtered = filterTokenTransferPermissions(grantedPermissions, {
          chainId,
        });
        return sortGatorPermissionsByStartTime(filtered);
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
    getGrantedPermissions,
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
    grantedPermissions,
    { aggregatedPermissionType, chainId, siteOrigin },
  ): PermissionInfoWithMetadata[] => {
    switch (aggregatedPermissionType) {
      case 'token-transfer': {
        const filtered = filterTokenTransferPermissions(grantedPermissions, {
          chainId,
          siteOrigin,
        });
        return sortGatorPermissionsByStartTime(filtered);
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
