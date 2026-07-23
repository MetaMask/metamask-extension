import { hasProperty, isObject } from '@metamask/utils';
import { v4 as uuidv4 } from 'uuid';
import type { Migrate } from './types';

export const version = 220;

/**
 * Moves the pre-consent buffering state from `MetaMetricsController` onto the
 * shared `AnalyticsController`:
 * - `MetaMetricsController.completedMetaMetricsOnboarding` → `AnalyticsController.consentDecisionMade`
 * - `MetaMetricsController.eventsBeforeMetricsOptIn` → `AnalyticsController.preConsentEventQueue`
 *
 * The `eventsBeforeMetricsOptIn` entries are raw, un-enriched event payloads
 * (the previous UI buffered them before MetaMetricsController enrichment), so
 * this one-time backfill produces `track` queue entries without the locale /
 * chain_id / environment_type enrichment that live events receive. When a
 * buffered event has `sensitiveProperties`, the migration mirrors live
 * AnalyticsController behavior by enqueueing a regular entry plus an
 * anonymous entry marked with `anonymous: true`. Only users who are still
 * undecided at upgrade time have a non-empty queue.
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
 * Marker used by AnalyticsController / the platform adapter to send an event
 * under the shared anonymous ID. Matches live `trackEvent` behavior when
 * `sensitiveProperties` are present.
 */
const ANONYMOUS_EVENT_PROPERTY = 'anonymous';

/**
 * Converts a list of raw buffered MetaMetrics event payloads into an
 * AnalyticsController pre-consent queue keyed by message id.
 *
 * Mirrors AnalyticsController's anonymous-events split:
 * - Always enqueue a regular track entry with non-sensitive `properties`.
 * - When `sensitiveProperties` are present, also enqueue a second track entry
 * that merges those values and sets `anonymous: true`.
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

    const baseProperties = {
      ...(isObject(event.properties) ? event.properties : {}),
      ...(event.category === undefined ? {} : { category: event.category }),
    };
    const sensitiveProperties = isObject(event.sensitiveProperties)
      ? event.sensitiveProperties
      : {};
    const hasSensitiveProperties = Object.keys(sensitiveProperties).length > 0;
    const timestamp = new Date().toISOString();

    // Regular (identified) event with non-sensitive properties only.
    const regularMessageId = uuidv4();
    preConsentEventQueue[regularMessageId] = {
      type: 'track',
      eventName: event.event,
      messageId: regularMessageId,
      timestamp,
      properties: baseProperties,
    };

    // Anonymous event carrying sensitive properties, matching live trackEvent.
    if (hasSensitiveProperties) {
      const anonymousMessageId = uuidv4();
      preConsentEventQueue[anonymousMessageId] = {
        type: 'track',
        eventName: event.event,
        messageId: anonymousMessageId,
        timestamp,
        properties: {
          ...baseProperties,
          ...sensitiveProperties,
          [ANONYMOUS_EVENT_PROPERTY]: true,
        },
      };
    }
  }

  return preConsentEventQueue;
}
