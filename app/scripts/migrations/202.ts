import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 202;

/**
 * Removes the deprecated `useBlockie` property from PreferencesController.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  if (
    !hasProperty(versionedData.data, 'PreferencesController') ||
    !isObject(versionedData.data.PreferencesController)
  ) {
    return;
  }

  if (hasProperty(versionedData.data.PreferencesController, 'useBlockie')) {
    delete versionedData.data.PreferencesController.useBlockie;
    changedControllers.add('PreferencesController');
  }
}) satisfies Migrate;
