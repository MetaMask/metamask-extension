import { cloneDeep, isArray } from 'lodash';
import {
  WALLET_SNAP_PERMISSION_KEY,
  SnapCaveatType,
} from '@metamask/rpc-methods';
import { hasProperty, isObject } from '@metamask/utils';
import { isFlask } from '../../../shared/constants/environment';

export const version = 81;

/**
 * Prior to this migration, snap <> dapp permissions were wildcards i.e. `wallet_snap_*`.
 * Now the permission has been changed to `wallet_snap` and the current snap permissions
 * that are under wildcards will be added as caveats to a parent `wallet_snap` permission.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(originalVersionedData: {
  meta: { version: number };
  data: Record<string, unknown>;
}) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  if (isFlask) {
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
  }
  return versionedData;
}

// We return state AS IS if there is any corruption
function transformState(state: Record<string, unknown>) {
  if (
    !hasProperty(state, 'PermissionController') ||
    !isObject(state.PermissionController)
  ) {
    return state;
  }
  const { PermissionController } = state;

  const { subjects } = PermissionController;

  if (!isObject(subjects)) {
    return state;
  }

  const snapPrefix = 'wallet_snap_';

  for (const [subjectName, subject] of Object.entries(subjects)) {
    if (!isObject(subject) || !isObject(subject.permissions)) {
      return state;
    }
    // We keep track of the latest permission's date and associated id
    // to assign to the wallet_snap permission after iterating through all permissions
    let date = 1;
    let id;
    const { permissions } = subject;
    // New permissions object that we use to tack on the `wallet_snap` permission
    const updatedPermissions = { ...permissions };
    for (const [permissionName, permission] of Object.entries(permissions)) {
      if (
        !isObject(permission) ||
        !hasProperty(permission, 'id') ||
        !hasProperty(permission, 'date')
      ) {
        return state;
      }

      // check if the permission is namespaced
      if (permissionName.startsWith(snapPrefix)) {
        // We create a wallet_snap key if we already don't have one
        if (!hasProperty(updatedPermissions, WALLET_SNAP_PERMISSION_KEY)) {
          updatedPermissions[WALLET_SNAP_PERMISSION_KEY] = {
            caveats: [{ type: SnapCaveatType.SnapIds, value: {} }],
            invoker: subjectName,
            parentCapability: WALLET_SNAP_PERMISSION_KEY,
          };
        }

        // Check if the existing permission is valid
        if (!isObject(updatedPermissions[WALLET_SNAP_PERMISSION_KEY])) {
          return state;
        }

        if (
          !isArray(
            (
              updatedPermissions[WALLET_SNAP_PERMISSION_KEY] as Record<
                string,
                unknown
              >
            ).caveats,
          )
        ) {
          return state;
        }

        // Adding the snap name to the wallet_snap permission's caveat value
        const snapId = permissionName.slice(snapPrefix.length);
        const caveat = (
          updatedPermissions[WALLET_SNAP_PERMISSION_KEY] as Record<string, any>
        ).caveats[0];
        caveat.value[snapId] = {};

        if (
          typeof permission.date !== 'number' ||
          typeof permission.id !== 'string'
        ) {
          return state;
        }

        // updating the date & id as we iterate through all permissions
        if (permission.date > date) {
          date = permission.date;
          id = permission.id;
        }

        // finally deleting the stale permission
        delete updatedPermissions[permissionName];
      }
    }

    // we reassign the date and id here after iterating through all permissions
    // and update the subject with the updated permissions
    if (updatedPermissions[WALLET_SNAP_PERMISSION_KEY]) {
      (
        updatedPermissions[WALLET_SNAP_PERMISSION_KEY] as Record<
          string,
          unknown
        >
      ).date = date;
      (
        updatedPermissions[WALLET_SNAP_PERMISSION_KEY] as Record<
          string,
          unknown
        >
      ).id = id;
      subject.permissions = updatedPermissions;
    }
  }

  return state;
}
