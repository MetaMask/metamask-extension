import { hasProperty } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 230;

/**
 * Deletes the residual `MetaMetricsController` key from persisted state.
 *
 * The controller was replaced by `AnalyticsController`; earlier migrations
 * (212-229) moved every field out, leaving an empty object behind. Users who
 * never had the key are unaffected.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  if (!hasProperty(data, 'MetaMetricsController')) {
    return;
  }

  delete data.MetaMetricsController;
  changedControllers.add('MetaMetricsController');
}) satisfies Migrate;
