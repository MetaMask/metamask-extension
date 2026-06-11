// Custom Segment Tracking
//
// This module provides standalone helpers for direct Segment tracking flows
// that happen outside AnalyticsController.

import { isObject, type Json } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  type MetaMetricsContext,
} from '../../../../shared/constants/metametrics';
import { segment } from '.';

/**
 * Partial state object that may contain AnalyticsController state.
 */
export type EarlySegmentState = Record<string, unknown> & {
  /**
   * AnalyticsController state.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  AnalyticsController?: unknown;
};

/**
 * Extracts analytics consent and ID from a partial state object. Returns the
 * `analyticsId` if the user has opted in, otherwise `null`.
 *
 * @param state - Partial state object that may contain AnalyticsController
 * state.
 * @returns The analyticsId if the user has opted in, otherwise null.
 */
function getMetaMetricsFromState(
  state: EarlySegmentState | null,
): string | null {
  if (!state?.AnalyticsController) {
    return null;
  }

  const analyticsState = state.AnalyticsController;

  // Validate it's an object (defensive check in case state shape changes)
  if (!isObject(analyticsState)) {
    console.error(
      'AnalyticsController is not an object in state:',
      typeof analyticsState,
    );
    return null;
  }

  // User hasn't opted in to analytics
  const { optedIn, analyticsId } = analyticsState;
  if (optedIn !== true) {
    return null;
  }

  // Validate analyticsId is a string.
  // If it's missing (undefined/null), that's expected - user hasn't set up analytics.
  // Only log an error if it exists but has an unexpected type.
  if (typeof analyticsId !== 'string') {
    if (analyticsId !== undefined && analyticsId !== null) {
      console.error(
        'analyticsId has unexpected type in state:',
        typeof analyticsId,
      );
    }
    return null;
  }

  return analyticsId;
}

/**
 * Arguments for tracking an early Segment event.
 */
type EarlySegmentEventArgs = {
  /**
   * Partial state object that may contain AnalyticsController state.
   */
  state: EarlySegmentState | null;
  /**
   * The MetaMetrics event name to track.
   */
  event: MetaMetricsEventName;
  /**
   * The MetaMetrics event category.
   */
  category: MetaMetricsEventCategory;
  /**
   * Additional properties to include with the event.
   */
  properties?: Record<string, Json>;
  /**
   * Additional context to include with the event.
   */
  context?: Partial<MetaMetricsContext>;
};

/**
 * Arguments for directly tracking a Segment event while analytics is opted out.
 */
type SegmentEventWhileOptedOutArgs = {
  /**
   * The analytics ID to attach as Segment userId.
   */
  analyticsId: string;
  /**
   * The MetaMetrics event name to track.
   */
  event: MetaMetricsEventName;
  /**
   * Additional properties to include with the event.
   */
  properties?: Record<string, Json>;
  /**
   * Additional context to include with the event.
   */
  context?: Partial<MetaMetricsContext>;
};

/**
 * Tracks an event directly to Segment using analytics consent and ID from
 * a partial state object.
 *
 * @param segmentEventArgs - The arguments for tracking the event.
 * @param segmentEventArgs.state - Partial state object that may contain AnalyticsController state.
 * @param segmentEventArgs.event - The MetaMetrics event name to track.
 * @param segmentEventArgs.category - The MetaMetrics event category.
 * @param segmentEventArgs.properties - Additional properties to include with the event.
 * @param segmentEventArgs.context - Additional context to include with the event.
 */
export function trackEarlySegmentEvent({
  state,
  event,
  category,
  properties,
  context,
}: EarlySegmentEventArgs): void {
  const analyticsId = getMetaMetricsFromState(state);

  // Don't track if user hasn't opted in to analytics
  if (!analyticsId) {
    return;
  }

  const baseContext = {
    app: {
      name: 'MetaMask Extension',
      version: process.env.METAMASK_VERSION,
    },
  };

  const mergedContext = context
    ? {
        ...baseContext,
        ...context,
        app: {
          ...baseContext.app,
          ...context.app,
        },
      }
    : baseContext;

  try {
    segment.track({
      userId: analyticsId,
      event,
      properties: {
        ...(properties ?? {}),
        category,
      },
      context: mergedContext,
    });

    // Flush immediately to ensure the event is sent before the page might reload
    segment.flush();
  } catch (error) {
    // Log but don't propagate analytics errors to ensure they never break the
    // flow. This matches MetaMetricsController's behavior.
    console.error('Failed to track early Segment event:', error);
  }
}

/**
 * Tracks an event directly to Segment while AnalyticsController is opted out.
 * This is intentionally narrow and should only be used for events that are
 * allowed to bypass analytics opt-out handling, such as Metrics Opt Out.
 *
 * @param segmentEventArgs - The arguments for tracking the event.
 * @param segmentEventArgs.analyticsId - The analytics ID to attach as Segment userId.
 * @param segmentEventArgs.event - The MetaMetrics event name to track.
 * @param segmentEventArgs.properties - Additional properties to include with the event.
 * @param segmentEventArgs.context - Additional context to include with the event.
 */
export function trackSegmentEventWhileOptedOut({
  analyticsId,
  event,
  properties,
  context,
}: SegmentEventWhileOptedOutArgs): void {
  if (!analyticsId) {
    return;
  }

  try {
    segment.track({
      userId: analyticsId,
      event,
      properties,
      context,
    });

    // Flush immediately so the opt-out event is not left in the in-memory SDK queue.
    segment.flush();
  } catch (error) {
    // Log but don't propagate analytics errors to ensure they never break the
    // flow. This matches MetaMetricsController's behavior.
    console.error('Failed to track Segment event while opted out:', error);
  }
}
