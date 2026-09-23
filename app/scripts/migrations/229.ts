import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 229;

/**
 * Moves the marketing campaign cookie id from
 * `MetaMetricsController.marketingCampaignCookieId` to
 * `AnalyticsController.marketingCampaignCookieId`.
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

  if (!hasProperty(metaMetricsController, 'marketingCampaignCookieId')) {
    return;
  }

  const { marketingCampaignCookieId } = metaMetricsController;
  delete metaMetricsController.marketingCampaignCookieId;
  changedControllers.add('MetaMetricsController');

  if (typeof marketingCampaignCookieId !== 'string') {
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
  analyticsController.marketingCampaignCookieId = marketingCampaignCookieId;

  changedControllers.add('AnalyticsController');
}) satisfies Migrate;
