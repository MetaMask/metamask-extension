import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 199;

/**
 * This migration removes the deprecated `petnamesEnabled` property from the
 * `preferences` object inside PreferencesController state.
 *
 * The `petnamesEnabled` preference was originally removed by migration 150, but
 * it was re-introduced because the PreferencesController default state still
 * included it. This migration cleans it up again, alongside the removal of the
 * property from the controller defaults and type.
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

  if (hasProperty(state.PreferencesController.preferences, 'petnamesEnabled')) {
    delete state.PreferencesController.preferences.petnamesEnabled;
    changedControllers.add('PreferencesController');
  }
}
