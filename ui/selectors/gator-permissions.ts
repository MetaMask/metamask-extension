
export type GatorPermissionState = {
  metamask: {
    isGatorPermissionsEnabled: boolean;
    gatorPermissionsListStringify: string;
    isFetchingGatorPermissions: boolean;
    isUpdatingGatorPermissions: boolean;
  };
};

/**
 * Get gator permissions data from UserStorageController.
 *
 * @param state - The current state
 * @returns Gator permissions data
 */
export function getGatorPermissions(state: GatorPermissionState) {
  console.log('getGatorPermissions(UI)', {
    isGatorPermissionsEnabled: state.metamask.isGatorPermissionsEnabled,
    gatorPermissionsListStringify: state.metamask.gatorPermissionsListStringify,
    isFetchingGatorPermissions: state.metamask.isFetchingGatorPermissions,
    isUpdatingGatorPermissions: state.metamask.isUpdatingGatorPermissions,
  });
  return [
    {
      origin: 'https://gator.com',
      id: '123',
    },
    {
      origin: 'https://gator.com',
      id: '456',
    },
  ];
}

/**
 * Get gator permissions for a specific origin.
 *
 * @param state - The current state
 * @param origin - The origin to get permissions for
 * @returns Profile sync permissions for the origin
 */
export function getGatorPermissionsForOrigin(state: GatorPermissionState, origin: string) {
  const gatorPermissions = getGatorPermissions(state);
  return gatorPermissions
}