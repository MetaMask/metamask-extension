import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 214;

/**
 * Migration 214: remove `latestNonAnonymousEventTimestamp` from
 * `MetaMetricsController`. This persisted timestamp was redundant with
 * settings-screen session state because navigation away from settings fires
 * analytics events that always updated the value.
 *
 * @param versionedData - Versioned MetaMask extension state; what we persist to disk.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  if (
    hasProperty(data, 'MetaMetricsController') &&
    isObject(data.MetaMetricsController) &&
    hasProperty(data.MetaMetricsController, 'latestNonAnonymousEventTimestamp')
  ) {
    delete data.MetaMetricsController.latestNonAnonymousEventTimestamp;
    changedControllers.add('MetaMetricsController');
  }
}) satisfies Migrate;

export default migrate;
