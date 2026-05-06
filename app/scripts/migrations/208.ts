import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 208;

const OBSOLETE_APP_STATE_PROPERTIES = [
  'isRampCardClosed',
  'nftsDetectionNoticeDismissed',
  'showAccountBanner',
  'showBetaHeader',
  'showNetworkBanner',
  'showPermissionsTour',
  'showTestnetMessageInDropdown',
  'surveyLinkLastClickedOrClosed',
] as const;

/**
 * Removes obsolete AppStateController properties that no longer have product
 * code paths that can read or update them.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  if (
    !hasProperty(versionedData.data, 'AppStateController') ||
    !isObject(versionedData.data.AppStateController)
  ) {
    return;
  }

  const { AppStateController } = versionedData.data;
  let changed = false;

  for (const property of OBSOLETE_APP_STATE_PROPERTIES) {
    if (hasProperty(AppStateController, property)) {
      delete AppStateController[property];
      changed = true;
    }
  }

  if (changed) {
    changedControllers.add('AppStateController');
  }
}) satisfies Migrate;
