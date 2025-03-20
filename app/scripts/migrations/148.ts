import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';
import { VersionedData } from '../background';
import { Caip25EndowmentPermissionName, Caip25CaveatType } from '@metamask/chain-agnostic-permission';

export const version = 148;

/**
 * Add sessionProperties property to CAIP-25 permission caveats
 *
 * @param originalVersionedData - Versioned MetaMask extension state
 * @returns Updated versioned MetaMask extension state
 */
export async function migrate(originalVersionedData) {
  const versionedData = cloneDeep(originalVersionedData);
  versionedData.meta.version = version;
  transformState(versionedData.data);
  return versionedData;
}

/**
 * Add sessionProperties property to CAIP-25 permission caveats
 *
 * @param state - The MetaMask state
 * @returns The updated MetaMask state
 */
function transformState(state: VersionedData['data']) {
  if (!hasProperty(state, 'PermissionController')) {
    return state;
  }

  if (!isObject(state.PermissionController)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.PermissionController is ${typeof state.PermissionController}`,
      ),
    );
    return state;
  }

  const { subjects } = state.PermissionController;

  if (!isObject(subjects)) {
    global.sentry?.captureException?.(
      new Error(
        `Migration ${version}: typeof state.PermissionController.subjects is ${typeof subjects}`,
      ),
    );
    return state;
  }


  for (const subject of Object.values(subjects)) {
    if (!isObject(subject) || !hasProperty(subject, 'permissions') || !isObject(subject.permissions)) {
      continue;
    }

    const { permissions } = subject;
    const caip25Permission = permissions[Caip25EndowmentPermissionName];

    if (!isObject(caip25Permission) || !Array.isArray(caip25Permission.caveats)) {
      continue;
    }

    for (const caveat of caip25Permission.caveats) {
      if (caveat.type === Caip25CaveatType && isObject(caveat.value)) {
        if (!hasProperty(caveat.value, 'sessionProperties')) {
          caveat.value.sessionProperties = {};
        }
      }
    }
  }

  return state;
}