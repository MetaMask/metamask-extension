import { hasProperty } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 228;

/**
 * Delete persisted MultichainBalancesController state. The controller is no
 * longer initialized, so leftover state is unused.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const state = versionedData.data;

  if (hasProperty(state, 'MultichainBalancesController')) {
    delete state.MultichainBalancesController;
    changedControllers.add('MultichainBalancesController');
  }
}) satisfies Migrate;

export default migrate;
