import type { Hex } from '@metamask/utils';
import {
  SupportedGatorPermissionType,
  GatorPermissionsMapByPermissionType,
  StoredGatorPermissionSanitized,
  SignerParam,
  PermissionTypes,
  GatorPermissionsMap,
  deserializeGatorPermissionsMap,
} from '@metamask/gator-permissions-controller';

export type FilteredGatorPermissionsByType = {
  count: number;
  chains: Hex[];
  permissions: {
    permission: StoredGatorPermissionSanitized<SignerParam, PermissionTypes>;
    chainId: Hex;
    permissionType: string;
  }[];
};

export type GatorPermissionState = {
  metamask: {
    isGatorPermissionsEnabled: boolean;
    gatorPermissionsMapSerialized: string;
    isFetchingGatorPermissions: boolean;
  };
};

export type GatorAssetItemListDetail = {
  [chainId: Hex]: {
    total: number;
    description: string;
  };
};

export type GatorAssetListDescriptionLookup = Record<string, string>;

const defaultGatorAssetListDescriptionLookup: GatorAssetListDescriptionLookup =
  {
    'token-streams': 'streaming permissions',
    'token-subscriptions': 'subscription permissions',
    other: 'custom permissions',
  };

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
export function getGatorPermissionsMap(
  state: GatorPermissionState,
): GatorPermissionsMap {
  return deserializeGatorPermissionsMap(
    state.metamask.gatorPermissionsMapSerialized,
  );
}

/**
 * Get gator permissions for a specific permission type and chainId.
 *
 * @param state - The current state
 * @param permissionType - The permission type to get permissions for (e.g. 'native-token-stream')
 * @param chainId - The chainId to get permissions for (e.g. 0x1)
 * @returns A list of gator permissions filtered by permission type and chainId.(e.g. [permission1, permission2] on chainId 0x1)
 */
export function getGatorPermissionByPermissionTypeAndChainId(
  state: GatorPermissionState,
  permissionType: SupportedGatorPermissionType,
  chainId: Hex,
): StoredGatorPermissionSanitized<SignerParam, PermissionTypes>[] {
  const gatorPermissionsMap = getGatorPermissionsMap(state);
  return gatorPermissionsMap[permissionType][chainId] || [];
}

/**
 * Get the total count of gator permissions of a specific permission type across chains.
 *
 * @param permissionsMapByPermissionType - The map of gator permissions by permission type
 * @returns The total count of gator permissions of a specific permission type across chains
 */
function getTotalCountOfGatorPermissionsPerChainId(
  permissionsMapByPermissionType: GatorPermissionsMapByPermissionType<SupportedGatorPermissionType>,
): Record<Hex, number> {
  const flattenedStoredGatorPermissions: StoredGatorPermissionSanitized<
    SignerParam,
    PermissionTypes
  >[] = Object.values(permissionsMapByPermissionType).flat();
  return flattenedStoredGatorPermissions.reduce(
    (acc, gatorPermission) => {
      const { permissionResponse } = gatorPermission;
      acc[permissionResponse.chainId] =
        (acc[permissionResponse.chainId] || 0) + 1;
      return acc;
    },
    {} as Record<Hex, number>,
  );
}

/**
 * Merge two records of chainId to total count of gator permissions.
 *
 * @param record1 - The first record to merge
 * @param record2 - The second record to merge
 * @returns A merged record of chainId to total count of gator permissions
 */
function mergeRecords(
  record1: Record<Hex, number>,
  record2: Record<Hex, number>,
): Record<Hex, number> {
  const mergedRecord = { ...record1 };

  for (const [key, value] of Object.entries(record2)) {
    mergedRecord[key as Hex] = (mergedRecord[key as Hex] || 0) + value;
  }

  return mergedRecord;
}

/**
 * Get gator asset list details.
 *
 * @param state - The current state
 * @param listType - The type of list to get (token-streams or token-subscriptions)
 * @param descriptionLookup - The lookup for the description of the list type
 * @returns A list of gator asset items.
 * @example
 * const gatorAssetList = getGatorAssetListDetail(state, 'token-streams');
 *
 * // {
 * //   '0x1': {
 * //     total: 2,
 * //     description: 'streaming permissions',
 * //   },
 * //   '0x89': {
 * //     total: 2,
 * //     description: 'streaming permissions',
 * //   },
 * // }
 */
export function getGatorAssetListDetail(
  state: GatorPermissionState,
  listType: string,
  descriptionLookup: GatorAssetListDescriptionLookup = defaultGatorAssetListDescriptionLookup,
): GatorAssetItemListDetail {
  const gatorPermissionsMap = getGatorPermissionsMap(state);

  let permissionsCountPerChainId: Record<Hex, number> = {};

  switch (listType) {
    case 'token-streams': {
      permissionsCountPerChainId = mergeRecords(
        getTotalCountOfGatorPermissionsPerChainId(
          gatorPermissionsMap['native-token-stream'],
        ),
        getTotalCountOfGatorPermissionsPerChainId(
          gatorPermissionsMap['erc20-token-stream'],
        ),
      );

      break;
    }
    case 'token-subscriptions': {
      permissionsCountPerChainId = mergeRecords(
        getTotalCountOfGatorPermissionsPerChainId(
          gatorPermissionsMap['native-token-periodic'],
        ),
        getTotalCountOfGatorPermissionsPerChainId(
          gatorPermissionsMap['erc20-token-periodic'],
        ),
      );
      break;
    }
    case 'other': {
      permissionsCountPerChainId = getTotalCountOfGatorPermissionsPerChainId(
        gatorPermissionsMap.other,
      );
      break;
    }
    default:
      console.warn(`Unknown list type: ${listType}`);
      break;
  }

  const gatorAssetItemList: GatorAssetItemListDetail = {};
  for (const [chainId, total] of Object.entries(permissionsCountPerChainId)) {
    gatorAssetItemList[chainId as Hex] = {
      total,
      description: descriptionLookup[listType] || 'No description',
    };
  }

  return gatorAssetItemList;
}

/**
 * Get aggregated list of gator permissions for a specific chainId.
 *
 * @param state - The current state
 * @param aggregatedPermissionType - The aggregated permission type to get permissions for (e.g. 'token-transfer' is a combination of the token streams and token subscriptions types)
 * @param chainId - The chainId to get permissions for (e.g. 0x1)
 * @returns A aggregated list of gator permissions filtered by chainId.
 */
export function getAggregatedGatorPermissionByChainId(
  state: GatorPermissionState,
  aggregatedPermissionType: string,
  chainId: Hex,
): StoredGatorPermissionSanitized<SignerParam, PermissionTypes>[] {
  const gatorPermissionsMap = getGatorPermissionsMap(state);

  switch (aggregatedPermissionType) {
    case 'token-transfer': {
      const nativeTokenStreams =
        gatorPermissionsMap['native-token-stream'][chainId] || [];

      const erc20TokenStreams =
        gatorPermissionsMap['erc20-token-stream'][chainId] || [];

      const nativeTokenPeriodicPermissions =
        gatorPermissionsMap['native-token-periodic'][chainId] || [];

      const erc20TokenPeriodicPermissions =
        gatorPermissionsMap['erc20-token-periodic'][chainId] || [];

      return [
        ...nativeTokenStreams,
        ...erc20TokenStreams,
        ...nativeTokenPeriodicPermissions,
        ...erc20TokenPeriodicPermissions,
      ];
    }
    default: {
      console.warn(
        `Unknown aggregated permission type: ${aggregatedPermissionType}`,
      );
      return [];
    }
  }
}

/**
 * Get aggregated token transfer permissions for all chains.
 *
 * @param state - The current state
 * @returns Object with chainId as key and aggregated permissions as value
 */
export function getAggregatedTokenTransferPermissionsByChainId(
  state: GatorPermissionState,
): Record<Hex, StoredGatorPermissionSanitized<SignerParam, PermissionTypes>[]> {
  const gatorPermissionsMap = getGatorPermissionsMap(state);
  const result: Record<
    Hex,
    StoredGatorPermissionSanitized<SignerParam, PermissionTypes>[]
  > = {};

  // Get all unique chain IDs from all token transfer permission types
  const allChainIds = new Set<Hex>();

  // Collect chain IDs from all token transfer permission types
  const tokenTransferTypes: (keyof GatorPermissionsMap)[] = [
    'native-token-stream',
    'erc20-token-stream',
    'native-token-periodic',
    'erc20-token-periodic',
  ];

  tokenTransferTypes.forEach((permissionType) => {
    const permissionsForType = gatorPermissionsMap[permissionType];
    if (permissionsForType) {
      Object.keys(permissionsForType).forEach((chainId) => {
        allChainIds.add(chainId as Hex);
      });
    }
  });

  // Aggregate permissions for each chain
  allChainIds.forEach((chainId) => {
    result[chainId] = getAggregatedGatorPermissionByChainId(
      state,
      'token-transfer',
      chainId,
    );
  });

  return result;
}

/**
 * Get filtered gator permissions by site origin.
 *
 * This function takes the full gator permissions map and filters it to return
 * only permissions that match the specified site origin.
 * It returns a simplified structure with total count, chains, and permissions.
 *
 * @param state - The current state
 * @param siteOrigin - The site origin to filter by (e.g., 'https://example.com')
 * @returns Object with total count, chain list, and all permissions
 */
export function getFilteredGatorPermissionsByType(
  state: GatorPermissionState,
  siteOrigin: string,
): FilteredGatorPermissionsByType {
  // Cast the state to the expected type for the internal function
  const gatorPermissions = getGatorPermissionsMap(
    state as GatorPermissionState,
  );

  const result = {
    count: 0,
    chains: new Set<Hex>(),
    permissions: [] as {
      permission: StoredGatorPermissionSanitized<SignerParam, PermissionTypes>;
      chainId: Hex;
      permissionType: string;
    }[],
  };

  // Process all token transfer permission types
  const tokenTransferTypes: (keyof GatorPermissionsMap)[] = [
    'native-token-stream',
    'erc20-token-stream',
    'native-token-periodic',
    'erc20-token-periodic',
  ];

  tokenTransferTypes.forEach((permissionType) => {
    const permissionsForType = gatorPermissions[permissionType];
    if (permissionsForType) {
      Object.entries(permissionsForType).forEach(([chainId, permissions]) => {
        const chainIdHex = chainId as Hex;
        // Filter permissions by site origin
        const filteredPermissions = permissions.filter(
          (
            permission: StoredGatorPermissionSanitized<
              SignerParam,
              PermissionTypes
            >,
          ) => permission.siteOrigin.toLowerCase() === siteOrigin.toLowerCase(),
        );

        if (filteredPermissions.length > 0) {
          result.count += filteredPermissions.length;
          result.chains.add(chainIdHex);

          // Add raw permission data
          filteredPermissions.forEach(
            (
              permission: StoredGatorPermissionSanitized<
                SignerParam,
                PermissionTypes
              >,
            ) => {
              result.permissions.push({
                permission,
                chainId: chainIdHex,
                permissionType,
              });
            },
          );
        }
      });
    }
  });

  // Convert Set to array for the final result
  return {
    count: result.count,
    chains: Array.from(result.chains),
    permissions: result.permissions,
  };
}
