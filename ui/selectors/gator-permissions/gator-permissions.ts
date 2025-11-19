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
import { isEqualCaseInsensitive } from '../../../shared/modules/string-utils';
import { safeDecodeURIComponent } from '../../components/multichain/pages/gator-permissions/helper';

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

const TOKEN_TRANSFER_PERMISSION_TYPES: SupportedGatorPermissionType[] = [
  'native-token-stream',
  'erc20-token-stream',
  'native-token-periodic',
  'erc20-token-periodic',
];

const getMetamask = (state: AppState) => state.metamask;

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
 * Get all token transfer permissions for a specific site origin.
 *
 * @param _state - The current state
 * @param siteOrigin - The site origin to filter by (e.g., 'https://example.com')
 * @returns Array of all token transfer permissions for the site origin
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
    return getTokenTransferPermissionsByOriginHelper(
      gatorPermissionsMap,
      siteOrigin,
    );
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
        return TOKEN_TRANSFER_PERMISSION_TYPES.flatMap(
          (permissionType) =>
            (gatorPermissionsMap[permissionType][chainId] ||
              []) as StoredGatorPermissionSanitized<
              Signer,
              PermissionTypesWithCustom
            >[],
        );
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
        return allPermissions.filter((permission) =>
          isEqualCaseInsensitive(
            safeDecodeURIComponent(permission.siteOrigin),
            decodedSiteOrigin,
          ),
        );
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
