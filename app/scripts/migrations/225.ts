import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 225;

/**
 * Removes `MetaMetricsController.fragments`.
 *
 * Event fragments now live on the shared `AnalyticsController`, which owns its
 * own `eventFragments` state. The persisted fragments are not carried over:
 * they belong to signature and transaction confirmations from a previous
 * session, and those journeys cannot be resumed after a restart, so
 * `AnalyticsController` would discard them on its next initialization anyway.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  if (
    !hasProperty(data, 'MetaMetricsController') ||
    !isObject(data.MetaMetricsController)
  ) {
    return;
  }

  const metaMetricsController = data.MetaMetricsController as Record<
    string,
    unknown
  >;

  if (!hasProperty(metaMetricsController, 'fragments')) {
    return;
  }

  delete metaMetricsController.fragments;
  changedControllers.add('MetaMetricsController');
}) satisfies Migrate;
