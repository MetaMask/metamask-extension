import { hasProperty } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 227;

const removedControllerStateKeys = [
  'AccountTracker',
  'CurrencyController',
  'MultichainAssetsController',
  'MultichainAssetsRatesController',
  'MultichainBalancesController',
  'TokenBalancesController',
  'TokenListController',
  'TokenRatesController',
] as const;

/**
 * Deletes persisted state for legacy asset controllers that are no longer
 * initialized.
 *
 * TokensController is intentionally retained because the temporary ASSETS-3346
 * metadata-healing path still reads its persisted state.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const state = versionedData.data;

  for (const controllerName of removedControllerStateKeys) {
    if (hasProperty(state, controllerName)) {
      delete state[controllerName];
      changedControllers.add(controllerName);
    }
  }
}) satisfies Migrate;

export default migrate;
