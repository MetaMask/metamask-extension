import { createSelector } from 'reselect';
import {
  SupportedGatorPermissionType,
  GatorPermissionsMap,
  deserializeGatorPermissionsMap,
  GatorPermissionsControllerState,
} from '@metamask/gator-permissions-controller';

export type AppState = {
  metamask: GatorPermissionsControllerState;
};

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
