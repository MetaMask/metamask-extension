import { cloneDeep } from 'lodash';
import {
  WALLET_SNAP_PERMISSION_KEY,
  SnapCaveatType,
} from '@metamask/rpc-methods';

const version = 78;

/**
 * Prior to this migration, snap <> dapp permissions were wildcards i.e. `wallet_snap_*`.
 * Now the permission has been changed to `wallet_snap` and the current snap permissions
 * that are under wildcards will be added as caveats to a parent `wallet_snap` permission.
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData);
    versionedData.meta.version = version;
    const state = versionedData.data;
    const newState = transformState(state);
    versionedData.data = newState;
    return versionedData;
  },
};

function transformState(state) {
  const PermissionController = state?.PermissionController || {};

  const { subjects } = PermissionController;

  const snapPrefix = 'wallet_snap_';

  for (const [subjectName, subject] of Object.entries(subjects)) {
    // we keep track of the latest permission's date and associated id
    // to assign to the wallet_snap permission
    let date = 1;
    let id;
    const { permissions } = subject;
    const updatedPermissions = { ...permissions };
    for (const [permissionName, permission] of Object.entries(permissions)) {
      if (permissionName.startsWith(snapPrefix)) {
        if (!updatedPermissions[WALLET_SNAP_PERMISSION_KEY]) {
          updatedPermissions[WALLET_SNAP_PERMISSION_KEY] = {
            caveats: [{ type: SnapCaveatType.SnapIds, value: {} }],
            invoker: subjectName,
            parentCapability: WALLET_SNAP_PERMISSION_KEY,
          };
        }
        const snapId = permissionName.slice(snapPrefix.length);
        const caveat =
          updatedPermissions[WALLET_SNAP_PERMISSION_KEY].caveats[0];
        caveat.value[snapId] = {};
        if (permission.date > date) {
          date = permission.date;
          id = permission.id;
        }
        delete updatedPermissions[permissionName];
      }
    }
    if (updatedPermissions[WALLET_SNAP_PERMISSION_KEY]) {
      updatedPermissions[WALLET_SNAP_PERMISSION_KEY].date = date;
      updatedPermissions[WALLET_SNAP_PERMISSION_KEY].id = id;
      subject.permissions = updatedPermissions;
    }
  }

  return state;
}
