import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 203;

/**
 * Maps deprecated `es` locale to `es_419` (Latin American Spanish, BCP 47 es-419).
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

  const { PreferencesController } = versionedData.data;

  if (
    hasProperty(PreferencesController, 'currentLocale') &&
    PreferencesController.currentLocale === 'es'
  ) {
    PreferencesController.currentLocale = 'es_419';
    changedControllers.add('PreferencesController');
  }
}) satisfies Migrate;
