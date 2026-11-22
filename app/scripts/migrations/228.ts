import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 228;

/**
 * Moves marketing consent from `MetaMetricsController.dataCollectionForMarketing`
 * to `AnalyticsController.optedInToMarketing`.
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

  if (!hasProperty(metaMetricsController, 'dataCollectionForMarketing')) {
    return;
  }

  const { dataCollectionForMarketing } = metaMetricsController;
  delete metaMetricsController.dataCollectionForMarketing;
  changedControllers.add('MetaMetricsController');

  if (typeof dataCollectionForMarketing !== 'boolean') {
    return;
  }

  if (
    !hasProperty(data, 'AnalyticsController') ||
    !isObject(data.AnalyticsController)
  ) {
    data.AnalyticsController = {};
  }

  const analyticsController = data.AnalyticsController as Record<
    string,
    unknown
  >;
  analyticsController.optedInToMarketing = dataCollectionForMarketing;
  analyticsController.marketingConsentDecisionMade = true;

  changedControllers.add('AnalyticsController');
}) satisfies Migrate;
