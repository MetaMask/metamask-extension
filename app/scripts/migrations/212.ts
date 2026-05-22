import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 212;

/**
 * Introduces `AnalyticsController` state (`analyticsId`, `optedIn`) and moves
 * participation off `MetaMetricsController.participateInMetaMetrics` onto
 * `completedMetaMetricsOnboarding` plus analytics `optedIn`. Legacy
 * `segmentApiCalls` entries are discarded because event queue persistence now
 * belongs to `AnalyticsController`.
 *
 * @param versionedData - The versioned data object to migrate.
 * @param changedControllers - A set used to record controllers that were modified.
 */
export const migrate = (async (versionedData, changedControllers) => {
  versionedData.meta.version = version;

  const data = versionedData.data as Record<string, unknown>;

  const metaMetricsController =
    hasProperty(data, 'MetaMetricsController') &&
    isObject(data.MetaMetricsController)
      ? (data.MetaMetricsController as Record<string, unknown>)
      : null;

  const participateInMetaMetrics =
    metaMetricsController !== null &&
    hasProperty(metaMetricsController, 'participateInMetaMetrics')
      ? metaMetricsController.participateInMetaMetrics
      : null;

  const metaMetricsId =
    metaMetricsController !== null &&
    hasProperty(metaMetricsController, 'metaMetricsId')
      ? metaMetricsController.metaMetricsId
      : null;

  const analyticsId =
    typeof metaMetricsId === 'string' && metaMetricsId.length > 0
      ? metaMetricsId
      : '';

  const optedIn = participateInMetaMetrics === true;
  const completedMetaMetricsOnboarding = participateInMetaMetrics !== null;

  if (
    !hasProperty(data, 'AnalyticsController') ||
    !isObject(data.AnalyticsController)
  ) {
    data.AnalyticsController = {
      analyticsId,
      optedIn,
    };
    changedControllers.add('AnalyticsController');
  }

  if (metaMetricsController) {
    if (hasProperty(metaMetricsController, 'metaMetricsId')) {
      delete metaMetricsController.metaMetricsId;
    }
    if (hasProperty(metaMetricsController, 'participateInMetaMetrics')) {
      delete metaMetricsController.participateInMetaMetrics;
    }
    if (hasProperty(metaMetricsController, 'segmentApiCalls')) {
      delete metaMetricsController.segmentApiCalls;
    }
    metaMetricsController.completedMetaMetricsOnboarding =
      completedMetaMetricsOnboarding;
    changedControllers.add('MetaMetricsController');
  }
}) satisfies Migrate;
