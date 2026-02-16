import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 195;

/**
 * This migration removes the `smartAccountOptIn` preference from the
 * PreferencesController state as this preference is no longer used.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedKeys - A set used to record keys that were modified.
 */
export const migrate = (async (versionedData, changedKeys) => {
  versionedData.meta.version = version;
  transformState(versionedData.data, changedKeys);
}) satisfies Migrate;

function transformState(
  state: Record<string, unknown>,
  changedKeys: Set<string>,
): void {
  if (
    hasProperty(state, 'PreferencesController') &&
    isObject(state.PreferencesController) &&
    hasProperty(state.PreferencesController, 'preferences') &&
    isObject(state.PreferencesController.preferences) &&
    hasProperty(state.PreferencesController.preferences, 'smartAccountOptIn')
  ) {
    delete state.PreferencesController.preferences.smartAccountOptIn;
    changedKeys.add('PreferencesController');
  }
}
