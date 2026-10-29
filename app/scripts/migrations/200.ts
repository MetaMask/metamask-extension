import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 200;

/**
 * This migration enables the `showDefaultAddress` preference by default for
 * existing users. Previously this was set to `false`, but now we want all users
 * to have it enabled when the feature flag is turned on.
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
    !hasProperty(state, 'PreferencesController') ||
    !isObject(state.PreferencesController)
  ) {
    return;
  }

  if (
    !hasProperty(state.PreferencesController, 'preferences') ||
    !isObject(state.PreferencesController.preferences)
  ) {
    return;
  }

  if (
    hasProperty(
      state.PreferencesController.preferences,
      'showDefaultAddress',
    ) &&
    state.PreferencesController.preferences.showDefaultAddress === false
  ) {
    state.PreferencesController.preferences.showDefaultAddress = true;
    changedControllers.add('PreferencesController');
  }
}
