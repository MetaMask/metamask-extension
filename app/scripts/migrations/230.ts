import { hasProperty } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 230;

/**
 * Delete persisted MultichainAssetsController state. The controller is no
 * longer initialized; non-EVM asset lists/metadata/ignored assets come from
 * AssetsController via assets-migration selectors when unify is enabled.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const state = versionedData.data;

  if (hasProperty(state, 'MultichainAssetsController')) {
    delete state.MultichainAssetsController;
    changedControllers.add('MultichainAssetsController');
  }
}) satisfies Migrate;

export default migrate;
