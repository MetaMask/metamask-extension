import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 205;

type PermissionInfoWithMetadata = {
  status?: 'Active' | 'Expired' | 'Revoked';
  revocationMetadata?: unknown;
};

type GatorPermissionsControllerState = {
  // these properties are removed in controller v2
  gatorPermissionsMapSerialized?: string;
  isGatorPermissionsEnabled?: boolean;
  gatorPermissionsProviderSnapId?: string;

  // grantedPermissions is added in controller v2
  grantedPermissions?: PermissionInfoWithMetadata[];
};

/**
 * This migration removes legacy state from GatorPermissionsController 1.x.x
 * - `gatorPermissionsMapSerialized` was cached data only.
 * - `isGatorPermissionsEnabled` was set on controller initialization, so never needed to be persisted.
 * - `gatorPermissionsProviderSnapId` was set on controller initialization, so never needed to be persisted.
 *
 * And sets a default `status` on all stored permissions that don't have one yet.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  if (
    !hasProperty(versionedData.data, 'GatorPermissionsController') ||
    !isObject(versionedData.data.GatorPermissionsController)
  ) {
    return;
  }

  const { GatorPermissionsController } = versionedData.data;
  const gatorPermissionsController =
    GatorPermissionsController as GatorPermissionsControllerState;

  if (
    !hasProperty(gatorPermissionsController, 'grantedPermissions') &&
    !hasProperty(gatorPermissionsController, 'gatorPermissionsMapSerialized') &&
    !hasProperty(gatorPermissionsController, 'isGatorPermissionsEnabled') &&
    !hasProperty(gatorPermissionsController, 'gatorPermissionsProviderSnapId')
  ) {
    return;
  }

  delete gatorPermissionsController.gatorPermissionsMapSerialized;
  delete gatorPermissionsController.isGatorPermissionsEnabled;
  delete gatorPermissionsController.gatorPermissionsProviderSnapId;

  if (Array.isArray(gatorPermissionsController.grantedPermissions)) {
    gatorPermissionsController.grantedPermissions.forEach((permission) => {
      if (!isObject(permission)) {
        return;
      }
      if (!hasProperty(permission, 'status')) {
        // If a permission does not yet have a status, we set a sensible default.
        // If the permission has revocation metadata, we set the status to 'Revoked',
        // otherwise, we set the status to 'Active'.
        // This will be resolved to the actual onchain status the first time permission data is synced.
        permission.status = hasProperty(permission, 'revocationMetadata')
          ? 'Revoked'
          : 'Active';
      }
    });
  }

  changedControllers.add('GatorPermissionsController');
}) satisfies Migrate;
