import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 217;

/**
 * Removes the obsolete enableMV3TimestampSave preference from
 * PreferencesController. MV3 keep-alive is always enabled from service worker
 * startup and is no longer user-configurable.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  if (removeEnableMV3TimestampSave(versionedData.data)) {
    changedControllers.add('PreferencesController');
  }
}) satisfies Migrate;

function removeEnableMV3TimestampSave(state: Record<string, unknown>): boolean {
  if (
    !hasProperty(state, 'PreferencesController') ||
    !isObject(state.PreferencesController)
  ) {
    return false;
  }

  if (!hasProperty(state.PreferencesController, 'enableMV3TimestampSave')) {
    return false;
  }

  delete state.PreferencesController.enableMV3TimestampSave;
  return true;
}
