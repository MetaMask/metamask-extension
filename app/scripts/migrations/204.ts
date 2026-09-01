import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 204;

/**
 * Sets `useSidePanelAsDefault` to `true` for existing users whose
 * `showExtensionInFullSizeView` preference is not already enabled.
 *
 * Users who already have `useSidePanelAsDefault === true` are skipped entirely
 * (no toast, no redundant preference write).
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
    !hasProperty(PreferencesController, 'preferences') ||
    !isObject(PreferencesController.preferences)
  ) {
    return;
  }

  const { preferences } = PreferencesController;

  if (preferences.showExtensionInFullSizeView === true) {
    return;
  }

  if (preferences.useSidePanelAsDefault === true) {
    return;
  }

  preferences.useSidePanelAsDefault = true;
  PreferencesController.showSidePanelMigrationToast = true;
  changedControllers.add('PreferencesController');
}) satisfies Migrate;
