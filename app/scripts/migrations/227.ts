import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 227;

/**
 * Deletes persisted `AccountOrderController` state.
 *
 * Account pin and hide now live on AccountTreeController group metadata.
 * The leftover address lists are no longer read or written.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  if (removeAccountOrderController(versionedData.data)) {
    changedControllers.add('AccountOrderController');
  }
}) satisfies Migrate;

function removeAccountOrderController(state: Record<string, unknown>): boolean {
  if (!hasProperty(state, 'AccountOrderController')) {
    return false;
  }

  if (
    state.AccountOrderController !== undefined &&
    !isObject(state.AccountOrderController)
  ) {
    return false;
  }

  delete state.AccountOrderController;
  return true;
}
