import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 198;

/**
 * This migration removes the deprecated `identities`, `lostIdentities`, and
 * `selectedAddress` properties from the PreferencesController state. These were
 * migrated to AccountsController in migration 105 but never cleaned up.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;
  transformState(versionedData.data, changedControllers);
}) satisfies Migrate;

const OBSOLETE_PROPERTIES = [
  'identities',
  'lostIdentities',
  'selectedAddress',
] as const;

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

  for (const prop of OBSOLETE_PROPERTIES) {
    if (hasProperty(state.PreferencesController, prop)) {
      delete state.PreferencesController[prop];
      changedControllers.add('PreferencesController');
    }
  }
}
