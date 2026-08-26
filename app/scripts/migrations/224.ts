import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 224;

/**
 * This migration removes the urlScanCache, tokenScanCache, and
 * addressScanCache properties from PhishingController state. Scan results are
 * now cached (and persisted) by the PhishingDataService query cache instead
 * of controller state.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const state = versionedData.data;

  if (
    !hasProperty(state, 'PhishingController') ||
    !isObject(state.PhishingController)
  ) {
    return;
  }

  const phishingController = state.PhishingController;
  const caches = ['urlScanCache', 'tokenScanCache', 'addressScanCache'];

  if (caches.some((cache) => hasProperty(phishingController, cache))) {
    for (const cache of caches) {
      delete phishingController[cache];
    }
    changedControllers.add('PhishingController');
  }
}) satisfies Migrate;

export default migrate;
