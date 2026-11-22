import { hasProperty, isObject } from '@metamask/utils';
import type { Migrate } from './types';

export const version = 212;
const ANONYMOUS_EVENT_PROPERTY = 'anonymous';

/**
 * Introduces `AnalyticsController` state (`analyticsId`, `optedIn`) and moves
 * participation off `MetaMetricsController.participateInMetaMetrics` onto
 * `completedMetaMetricsOnboarding` plus analytics `optedIn`. Legacy
 * `segmentApiCalls` entries are moved to `AnalyticsController.eventQueue`.
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
    const eventQueue = buildAnalyticsEventQueue(
      metaMetricsController?.segmentApiCalls,
    );
    const analyticsController: Record<string, unknown> = {
      analyticsId,
      optedIn,
    };
    if (Object.keys(eventQueue).length > 0) {
      analyticsController.eventQueue = eventQueue;
    }
    data.AnalyticsController = analyticsController;
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

function buildAnalyticsEventQueue(
  segmentApiCalls: unknown,
): Record<string, unknown> {
  if (!isObject(segmentApiCalls)) {
    return {};
  }

  const eventQueue: Record<string, unknown> = {};
  for (const [messageId, segmentApiCall] of Object.entries(segmentApiCalls)) {
    const queuedEvent = buildAnalyticsQueuedEvent(messageId, segmentApiCall);
    if (queuedEvent) {
      eventQueue[messageId] = queuedEvent;
    }
  }

  return eventQueue;
}

function buildAnalyticsQueuedEvent(
  fallbackMessageId: string,
  segmentApiCall: unknown,
): Record<string, unknown> | null {
  if (!isObject(segmentApiCall)) {
    return null;
  }

  const { eventType, payload } = segmentApiCall as Record<string, unknown>;
  if (!isObject(payload)) {
    return null;
  }

  const messageId =
    typeof payload.messageId === 'string'
      ? payload.messageId
      : fallbackMessageId;
  const timestamp =
    typeof payload.timestamp === 'string'
      ? payload.timestamp
      : new Date().toISOString();

  if (eventType === 'track' && typeof payload.event === 'string') {
    return {
      type: 'track',
      eventName: payload.event,
      messageId,
      timestamp,
      ...getQueuedProperties(payload),
      ...getQueuedContext(payload),
    };
  }

  if (eventType === 'identify' && typeof payload.userId === 'string') {
    return {
      type: 'identify',
      userId: payload.userId,
      messageId,
      timestamp,
      ...(isObject(payload.traits) ? { traits: payload.traits } : {}),
      ...getQueuedContext(payload),
    };
  }

  if (eventType === 'page' && typeof payload.name === 'string') {
    return {
      type: 'view',
      name: payload.name,
      messageId,
      timestamp,
      ...getQueuedProperties(payload),
      ...getQueuedContext(payload),
    };
  }

  return null;
}

function getQueuedProperties(payload: Record<string, unknown>): {
  properties?: Record<string, unknown>;
} {
  const isAnonymous = typeof payload.anonymousId === 'string';
  if (!isObject(payload.properties) && !isAnonymous) {
    return {};
  }

  const properties = isObject(payload.properties)
    ? { ...(payload.properties as Record<string, unknown>) }
    : {};
  if (isAnonymous) {
    properties[ANONYMOUS_EVENT_PROPERTY] = true;
  }

  return { properties };
}

function getQueuedContext(payload: Record<string, unknown>): {
  context?: Record<string, unknown>;
} {
  return isObject(payload.context)
    ? { context: payload.context as Record<string, unknown> }
    : {};
}
