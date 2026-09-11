import { hasProperty } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 227;

/**
 * Delete persisted TokenListController state. The controller is no longer
 * initialized, so leftover state is unused.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const state = versionedData.data;

  if (hasProperty(state, 'TokenListController')) {
    delete state.TokenListController;
    changedControllers.add('TokenListController');
  }
}) satisfies Migrate;

export default migrate;
