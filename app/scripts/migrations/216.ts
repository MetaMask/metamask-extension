import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 216;

const OBSOLETE_APP_STATE_CONTROLLER_PROPERTIES = [
  'importTokensModalOpen',
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

  if (removeObsoleteAppStateControllerProperties(versionedData.data)) {
    changedControllers.add('AppStateController');
  }
}) satisfies Migrate;

function removeObsoleteAppStateControllerProperties(
  state: Record<string, unknown>,
): boolean {
  if (
    !hasProperty(state, 'AppStateController') ||
    !isObject(state.AppStateController)
  ) {
    return false;
  }

  let changed = false;
  for (const property of OBSOLETE_APP_STATE_CONTROLLER_PROPERTIES) {
    if (hasProperty(state.AppStateController, property)) {
      delete state.AppStateController[property];
      changed = true;
    }
  }

  return changed;
}
