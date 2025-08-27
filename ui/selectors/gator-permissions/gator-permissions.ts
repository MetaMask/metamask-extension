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

export type GatorAssetListType =
  | 'token-streams'
  | 'token-subscriptions'
  | 'other';

export type GatorAssetListDescriptionLookup = {
  'token-streams': string;
  'token-subscriptions': string;
  other: string;
};

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
  listType: GatorAssetListType,
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
