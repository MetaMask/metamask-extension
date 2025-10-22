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
        const nativeTokenStreams =
          getGatorPermissionsCountAcrossAllChainsByPermissionType(
            gatorPermissionsMap,
            'native-token-stream',
          );

        const erc20TokenStreams =
          getGatorPermissionsCountAcrossAllChainsByPermissionType(
            gatorPermissionsMap,
            'erc20-token-stream',
          );

        const nativeTokenPeriodicPermissions =
          getGatorPermissionsCountAcrossAllChainsByPermissionType(
            gatorPermissionsMap,
            'native-token-periodic',
          );

        const erc20TokenPeriodicPermissions =
          getGatorPermissionsCountAcrossAllChainsByPermissionType(
            gatorPermissionsMap,
            'erc20-token-periodic',
          );

        return (
          nativeTokenStreams +
          erc20TokenStreams +
          nativeTokenPeriodicPermissions +
          erc20TokenPeriodicPermissions
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
        const streamsPermissionsCountPerChainId =
          mergePermissionsGroupMetaDataByChainId(
            getTotalCountOfGatorPermissionsPerChainId(
              gatorPermissionsMap['native-token-stream'],
            ),
            getTotalCountOfGatorPermissionsPerChainId(
              gatorPermissionsMap['erc20-token-stream'],
            ),
          );

        const periodicPermissionsCountPerChainId =
          mergePermissionsGroupMetaDataByChainId(
            getTotalCountOfGatorPermissionsPerChainId(
              gatorPermissionsMap['native-token-periodic'],
            ),
            getTotalCountOfGatorPermissionsPerChainId(
              gatorPermissionsMap['erc20-token-periodic'],
            ),
          );

        const totalPermissionsCountPerChainId =
          mergePermissionsGroupMetaDataByChainId(
            streamsPermissionsCountPerChainId,
            periodicPermissionsCountPerChainId,
          );

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

  const decodedSiteOrigin = decodeURIComponent(siteOrigin);
  return Object.values(gatorPermissionsMap[permissionType])
    .flat() // flatten array of arrays to get permission across all chains
    .filter((gatorPermission) => {
      if (!gatorPermission) {
        throw new Error(
          `Undefined values present in the gatorPermissionsMap for permission type: ${permissionType}`,
        );
      }

      return isEqualCaseInsensitive(
        decodeURIComponent(gatorPermission.siteOrigin),
        decodedSiteOrigin,
      );
    });
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
  const tokenTransferPermissions = [
    ...filterPermissionsByOriginAndType(
      gatorPermissionsMap,
      siteOrigin,
      'native-token-stream',
    ),
    ...filterPermissionsByOriginAndType(
      gatorPermissionsMap,
      siteOrigin,
      'erc20-token-stream',
    ),
    ...filterPermissionsByOriginAndType(
      gatorPermissionsMap,
      siteOrigin,
      'native-token-periodic',
    ),
    ...filterPermissionsByOriginAndType(
      gatorPermissionsMap,
      siteOrigin,
      'erc20-token-periodic',
    ),
  ];

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
