import { hasProperty, isObject } from '@metamask/utils';
import { v4 as uuidv4 } from 'uuid';
import type { Migrate } from './types';

export const version = 219;

/**
 * Moves the pre-consent buffering state from `MetaMetricsController` onto the
 * shared `AnalyticsController`:
 * - `MetaMetricsController.completedMetaMetricsOnboarding` → `AnalyticsController.consentDecisionMade`
 * - `MetaMetricsController.eventsBeforeMetricsOptIn` → `AnalyticsController.preConsentEventQueue`
 *
 * The `eventsBeforeMetricsOptIn` entries are raw, un-enriched event payloads
 * (the previous UI buffered them before MetaMetricsController enrichment), so
 * this one-time backfill produces `track` queue entries without the locale /
 * chain_id / environment_type enrichment that live events receive. Only users
 * who are still undecided at upgrade time have a non-empty queue.
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

  const completedMetaMetricsOnboarding =
    metaMetricsController !== null &&
    metaMetricsController.completedMetaMetricsOnboarding === true;

  const preConsentEventQueue = buildPreConsentEventQueue(
    metaMetricsController?.eventsBeforeMetricsOptIn,
  );

  // Merge into the existing AnalyticsController state (created by migration 212)
  // without clobbering `analyticsId` / `optedIn` / `eventQueue`.
  const analyticsController =
    hasProperty(data, 'AnalyticsController') &&
    isObject(data.AnalyticsController)
      ? (data.AnalyticsController as Record<string, unknown>)
      : ((data.AnalyticsController = {}) as Record<string, unknown>);

  analyticsController.consentDecisionMade = completedMetaMetricsOnboarding;
  if (Object.keys(preConsentEventQueue).length > 0) {
    analyticsController.preConsentEventQueue = preConsentEventQueue;
  }
  changedControllers.add('AnalyticsController');

  if (metaMetricsController) {
    if (hasProperty(metaMetricsController, 'completedMetaMetricsOnboarding')) {
      delete metaMetricsController.completedMetaMetricsOnboarding;
    }
    if (hasProperty(metaMetricsController, 'eventsBeforeMetricsOptIn')) {
      delete metaMetricsController.eventsBeforeMetricsOptIn;
    }
    changedControllers.add('MetaMetricsController');
  }
}) satisfies Migrate;

/**
 * Converts a list of raw buffered MetaMetrics event payloads into an
 * AnalyticsController pre-consent queue keyed by message id.
 *
 * @param eventsBeforeMetricsOptIn - The raw buffered events from MetaMetricsController.
 * @returns The pre-consent event queue.
 */
function buildPreConsentEventQueue(
  eventsBeforeMetricsOptIn: unknown,
): Record<string, unknown> {
  if (!Array.isArray(eventsBeforeMetricsOptIn)) {
    return {};
  }

  const preConsentEventQueue: Record<string, unknown> = {};
  for (const event of eventsBeforeMetricsOptIn) {
    if (!isObject(event) || typeof event.event !== 'string') {
      continue;
    }

    const messageId = uuidv4();
    const properties = {
      ...(isObject(event.properties) ? event.properties : {}),
      ...(isObject(event.sensitiveProperties) ? event.sensitiveProperties : {}),
      ...(event.category === undefined ? {} : { category: event.category }),
    };

    preConsentEventQueue[messageId] = {
      type: 'track',
      eventName: event.event,
      messageId,
      timestamp: new Date().toISOString(),
      properties,
    };
  }

  return preConsentEventQueue;
}
