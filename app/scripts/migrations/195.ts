import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 195;

/**
 * This migration removes the `smartAccountOptIn` preference from the
 * PreferencesController state as this preference is no longer used.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;
  transformState(versionedData.data, changedControllers);
}) satisfies Migrate;

function transformState(
  state: Record<string, unknown>,
  changedControllers: Set<string>,
): void {
  if (
    hasProperty(state, 'PreferencesController') &&
    isObject(state.PreferencesController) &&
    hasProperty(state.PreferencesController, 'preferences') &&
    isObject(state.PreferencesController.preferences) &&
    hasProperty(state.PreferencesController.preferences, 'smartAccountOptIn')
  ) {
    delete state.PreferencesController.preferences.smartAccountOptIn;
    changedControllers.add('PreferencesController');
  }
}
