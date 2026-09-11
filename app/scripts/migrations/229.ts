import { hasProperty } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 229;

/**
 * Delete persisted MultichainAssetsRatesController state. The controller is no
 * longer initialized, so leftover state is unused. Historical prices are fetched
 * on demand via the Price API (`useHistoricalPrices`); conversion rates come
 * from AssetsController via assets-migration selectors when unify is enabled.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const state = versionedData.data;

  if (hasProperty(state, 'MultichainAssetsRatesController')) {
    delete state.MultichainAssetsRatesController;
    changedControllers.add('MultichainAssetsRatesController');
  }
}) satisfies Migrate;

export default migrate;
