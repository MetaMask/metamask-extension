import { hasProperty } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 222;

/**
 * Delete persisted EnsController state, which is no longer needed.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const state = versionedData.data;

  if (hasProperty(state, 'EnsController')) {
    delete state.EnsController;
    changedControllers.add('EnsController');
  }
}) satisfies Migrate;

export default migrate;
