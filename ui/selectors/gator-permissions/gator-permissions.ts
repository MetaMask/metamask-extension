import { deserializeGatorPermissionsList, GatorPermissionsList } from "@metamask/gator-permissions-controller";

export type GatorPermissionState = {
  metamask: {
    isGatorPermissionsEnabled: boolean;
    gatorPermissionsListStringify: string;
    isFetchingGatorPermissions: boolean;
    isUpdatingGatorPermissions: boolean;
  };
};

/**
 * Get gator permissions data from GatorPermissionsController.
 *
 * @param state - The current state
 * @returns Gator permissions data
 */
export function getGatorPermissions(state: GatorPermissionState): GatorPermissionsList {
  console.log('getGatorPermissions(selector) permissions controller state:', {
    isGatorPermissionsEnabled: state.metamask.isGatorPermissionsEnabled,
    gatorPermissionsListStringify: state.metamask.gatorPermissionsListStringify,
    isFetchingGatorPermissions: state.metamask.isFetchingGatorPermissions,
    isUpdatingGatorPermissions: state.metamask.isUpdatingGatorPermissions,
  });

  return deserializeGatorPermissionsList(state.metamask.gatorPermissionsListStringify);
}

/**
 * Get gator permissions for a specific origin.
 *
 * @param state - The current state
 * @param origin - The origin to get permissions for
 *
 * @returns A list of gator permissions filtered by permission type.
 */
export function getGatorPermissionsForOrigin(state: GatorPermissionState, origin: string): GatorPermissionsList {
  // TODO: Add filter by origin
  return getGatorPermissions(state);
}

/**
 * Get gator permissions for a specific permission type.
 *
 * @param state - The current state
 * @param permissionType - The permission type to get permissions for
 * @param origin - The origin to get permissions for (optional)
 * @returns A list of gator permissions filtered by permission type.
 */
export function getGatorPermissionsForPermissionType(
  state: GatorPermissionState,
  permissionType: string,
  origin?: string,
): GatorPermissionsList {
  // TODO: Add filter by permission type and optional origin
  return getGatorPermissions(state);
}