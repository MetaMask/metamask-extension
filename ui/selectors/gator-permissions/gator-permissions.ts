import type { Hex } from '@metamask/utils';
import {
  deserializeGatorPermissionsList,
  GatorPermissionsList,
  SupportedGatorPermissionType,
  GatorPermissionsListByPermissionType,
  GatorPermissionsListItemsByPermissionTypeAndChainId,
} from '@metamask/gator-permissions-controller';

export type GatorPermissionState = {
  metamask: {
    isGatorPermissionsEnabled: boolean;
    gatorPermissionsListStringify: string;
    isFetchingGatorPermissions: boolean;
  };
};

export type GatorAssetItemListDetail = {
  [chainId: Hex]: {
    total: number;
    description: string;
  };
};

export type GatorAssetListType = 'token-streams' | 'token-subscriptions';

export type GatorAssetListDescriptionLookup = {
  'token-streams': string;
  'token-subscriptions': string;
};

const defaultGatorAssetListDescriptionLookup: GatorAssetListDescriptionLookup =
  {
    'token-streams': 'streaming permissions',
    'token-subscriptions': 'subscription permissions',
  };

/**
 * Get gator permissions list from GatorPermissionsController.
 *
 * @param state - The current state
 * @returns Gator permissions list
 */
export function getGatorPermissionsList(
  state: GatorPermissionState,
): GatorPermissionsList {
  return deserializeGatorPermissionsList(
    state.metamask.gatorPermissionsListStringify,
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
export function getGatorPermissionByPermissionTypeAndChainId<
  T extends SupportedGatorPermissionType,
>(
  state: GatorPermissionState,
  permissionType: T,
  chainId: Hex,
): GatorPermissionsListItemsByPermissionTypeAndChainId<T> {
  const gatorPermissionsList = getGatorPermissionsList(state);
  return gatorPermissionsList[permissionType][chainId] || [];
}

/**
 * Get the total count of gator permissions of a specific permission type across chains.
 *
 * @param permissions - The gator permissions to get the total count of
 * @returns The total count of gator permissions of a specific permission type across chains
 */
function getTotalCountOfGatorPermissionsPerChainId(
  permissionsByPermissionType: GatorPermissionsListByPermissionType<SupportedGatorPermissionType>,
): Record<Hex, number> {
  // Flatten the permissions list all permission types across chains
  const flattenedStoredGatorPermissions = Object.values(
    permissionsByPermissionType,
  ).flat();
  return flattenedStoredGatorPermissions.reduce((acc, gatorPermission) => {
    const { permissionResponse } = gatorPermission;
    acc[permissionResponse.chainId] =
      (acc[permissionResponse.chainId] || 0) + 1;
    return acc;
  }, {} as Record<Hex, number>);
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
    mergedRecord[key] = (mergedRecord[key] || 0) + value;
  }

  return mergedRecord;
}

/**
 * Get gator asset list details.
 *
 * @param state - The current state
 * @param listType - The type of list to get (token-streams or token-subscriptions)
 * @returns A list of gator asset items
 *
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
  const gatorPermissionsList = getGatorPermissionsList(state);

  let permissionsCountPerChainId: Record<Hex, number> = {};

  switch (listType) {
    case 'token-streams': {
      permissionsCountPerChainId = mergeRecords(
        getTotalCountOfGatorPermissionsPerChainId(
          gatorPermissionsList['native-token-stream'],
        ),
        getTotalCountOfGatorPermissionsPerChainId(
          gatorPermissionsList['erc20-token-stream'],
        ),
      );

      break;
    }
    case 'token-subscriptions': {
      permissionsCountPerChainId = getTotalCountOfGatorPermissionsPerChainId(
        gatorPermissionsList['native-token-periodic'],
      );
      break;
    }
    default:
      console.warn(`Unknown list type: ${listType}`);
      break;
  }

  const gatorAssetItemList: GatorAssetItemListDetail = {};
  for (const [chainId, total] of Object.entries(permissionsCountPerChainId)) {
    gatorAssetItemList[chainId] = {
      total,
      description: descriptionLookup[listType] || 'No description',
    };
  }

  return gatorAssetItemList;
}
