import { cloneDeep } from 'lodash';

const version = 78;

/**
 * Prior to this migration, snap <> dapp permissions were wildcards `wallet_snap_*`.
 * Now the permission has been changed to `wallet_snap` and the current `wallet_snap_*`
 * permissions will be added as caveats to the parent `wallet_snap` permission.
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
    let date = 0;
    let id;
    const { permissions } = subject;
    const updatedPermissions = { ...permissions };
    for (const [permissionName, permission] of Object.entries(permissions)) {
      if (permissionName.startsWith(snapPrefix)) {
        if (!updatedPermissions.wallet_snap) {
          updatedPermissions.wallet_snap = {
            caveats: [{ type: 'snapIds', value: {} }],
            invoker: subjectName,
            parentCapability: 'wallet_snap',
          };
        }
        const snapId = permissionName.slice(snapPrefix.length);
        const caveat = updatedPermissions.wallet_snap.caveats[0];
        caveat.value[snapId] = {};
        if (permission.date > date) {
          date = permission.date;
          id = permission.id;
        }
        delete updatedPermissions[permissionName];
      }
    }
    if (updatedPermissions.wallet_snap) {
      updatedPermissions.wallet_snap.date = date;
      updatedPermissions.wallet_snap.id = id;
      subject.permissions = updatedPermissions;
    }
  }

  return state;
}
