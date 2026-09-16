import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 227;

/**
 * Deletes persisted `hiddenAccountList` from AccountOrderController.
 *
 * Account hide/unhide is stored on AccountTreeController group metadata.
 * The leftover address list is no longer read or written.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  if (removeHiddenAccountList(versionedData.data)) {
    changedControllers.add('AccountOrderController');
  }
}) satisfies Migrate;

function removeHiddenAccountList(state: Record<string, unknown>): boolean {
  if (
    !hasProperty(state, 'AccountOrderController') ||
    !isObject(state.AccountOrderController)
  ) {
    return false;
  }

  if (!hasProperty(state.AccountOrderController, 'hiddenAccountList')) {
    return false;
  }

  delete state.AccountOrderController.hiddenAccountList;
  return true;
}
