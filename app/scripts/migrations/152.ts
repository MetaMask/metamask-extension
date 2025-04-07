import { cloneDeep } from 'lodash';
import { hasProperty, isObject } from '@metamask/utils';

export const version = 152;

// inlined from @metamask/chain-agnostic-permission
const Caip25CaveatType = 'authorizedScopes';
const Caip25EndowmentPermissionName = 'endowment:caip25';

type VersionedData = {
  meta: { version: number };
  data: Record<string, unknown>;
};
/**
 * Add sessionProperties property to CAIP-25 permission caveats
 *
 * @param originalVersionedData - Versioned MetaMask extension state
 * @returns Updated versioned MetaMask extension state
 */
export async function migrate(originalVersionedData: VersionedData) {
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
    if (
      !isObject(subject) ||
      !hasProperty(subject, 'permissions') ||
      !isObject(subject.permissions)
    ) {
      continue;
    }

    const { permissions } = subject;
    const caip25Permission = permissions[Caip25EndowmentPermissionName];

    if (
      !isObject(caip25Permission) ||
      !Array.isArray(caip25Permission.caveats)
    ) {
      continue;
    }

    const caip25Caveat = caip25Permission.caveats.find(
      (caveat) => caveat.type === Caip25CaveatType,
    );

    if (
      caip25Caveat &&
      isObject(caip25Caveat.value) &&
      !hasProperty(caip25Caveat.value, 'sessionProperties')
    ) {
      caip25Caveat.value.sessionProperties = {};
    }
  }

  return state;
}
