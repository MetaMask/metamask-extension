import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 227;

/**
 * Removes `MetaMetricsController.tracesBeforeMetricsOptIn`.
 *
 * Pre-consent Sentry traces are now buffered in memory by
 * `SentryTracingService`. Persisted queued traces from a previous session
 * cannot be replayed after restart, so they are discarded.
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

  if (!hasProperty(metaMetricsController, 'tracesBeforeMetricsOptIn')) {
    return;
  }

  delete metaMetricsController.tracesBeforeMetricsOptIn;
  changedControllers.add('MetaMetricsController');
}) satisfies Migrate;
