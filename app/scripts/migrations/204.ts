import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 204;

/**
 * Sets `useSidePanelAsDefault` to `true` for existing users whose
 * `showExtensionInFullSizeView` preference is not already enabled.
 *
 * Sets `showSidePanelMigrationToast` only when the default actually changes
 * from non–side-panel to side panel (users who already used the side panel
 * as default do not get the toast).
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

  const alreadyHadSidePanelAsDefault =
    preferences.useSidePanelAsDefault === true;

  preferences.useSidePanelAsDefault = true;

  if (!alreadyHadSidePanelAsDefault) {
    PreferencesController.showSidePanelMigrationToast = true;
  }

  changedControllers.add('PreferencesController');
}) satisfies Migrate;
