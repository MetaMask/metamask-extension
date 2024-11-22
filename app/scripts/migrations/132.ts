import {
  CaveatSpecificationConstraint,
  ExtractPermission,
  PermissionControllerState,
  PermissionSpecificationConstraint,
} from '@metamask/permission-controller';
import { SnapControllerState } from '@metamask/snaps-controllers';
import { hasProperty, isObject } from '@metamask/utils';
import { cloneDeep } from 'lodash';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};

type ActualPermissionControllerState = PermissionControllerState<
  ExtractPermission<
    PermissionSpecificationConstraint,
    CaveatSpecificationConstraint
  >
>;

export const version = 132;

/**
 * Handle the `snap_manageAccounts` removal from the restricted methods of snap.
 *
 * @param originalVersionedData - Versioned MetaMask extension state, exactly
 * what we persist to dist.
 * @param originalVersionedData.meta - State metadata.
 * @param originalVersionedData.meta.version - The current state version.
 * @param originalVersionedData.data - The persisted MetaMask state, keyed by
 * controller.
 * @returns Updated versioned MetaMask extension state.
 */
export async function migrate(
  originalVersionedData: VersionedData,
): Promise<VersionedData> {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

function transformState(state: Record<string, unknown>): void {
  if (
    !hasProperty(state, 'SnapController') ||
    !isObject(state.SnapController)
  ) {
    return;
  }

  if (
    !hasProperty(state, 'PermissionController') ||
    !isObject(state.PermissionController)
  ) {
    return;
  }

  const snapControllerState = state.SnapController as SnapControllerState;
  const permissionControllerState =
    state.PermissionController as ActualPermissionControllerState;

  if (
    !isObject(snapControllerState) ||
    !hasProperty(snapControllerState, 'snaps')
  ) {
    return;
  }

  if (
    !isObject(permissionControllerState) ||
    !hasProperty(permissionControllerState, 'subjects')
  ) {
    return;
  }

  const snaps = snapControllerState.snaps;
  const subjects = permissionControllerState.subjects;

  Object.keys(snaps).forEach((snapId) => {
    if (subjects[snapId]) {
      const newSnapPermissions = Object.fromEntries(
        Object.entries(subjects[snapId].permissions).filter(
          ([permissionName]) => permissionName !== 'snap_manageAccounts',
        ),
      );

      (state.PermissionController as ActualPermissionControllerState).subjects[
        snapId
      ].permissions = newSnapPermissions;
    }
  });

  console.log(state);
}
