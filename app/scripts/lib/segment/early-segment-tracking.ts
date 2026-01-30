// Early Segment Tracking
//
// This module provides a standalone way to track Segment events before
// MetaMetricsController is initialized. It extracts the MetaMetrics consent
// and ID from a partial state object and sends events directly to Segment.

import { isObject, type Json } from '@metamask/utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  type MetaMetricsContext,
} from '../../../../shared/constants/metametrics';
import { segment } from '.';

/**
 * Partial state object that may contain MetaMetricsController state.
 */
export type EarlySegmentState = Record<string, unknown> & {
  /**
   * MetaMetricsController state.
   */
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  MetaMetricsController?: unknown;
};

/**
 * Extracts MetaMetrics consent and ID from a partial state object. Returns the
 * `metaMetricsId` if the user has opted in, otherwise `null`.
 *
 * @param state - Partial state object that may contain MetaMetricsController
 * state.
 * @returns The metaMetricsId if the user has opted in, otherwise null.
 */
function getMetaMetricsFromState(
  state: EarlySegmentState | null,
): string | null {
  if (!state?.MetaMetricsController) {
    return null;
  }

  const metaMetricsState = state.MetaMetricsController;

  // Validate it's an object (defensive check in case state shape changes)
  if (!isObject(metaMetricsState)) {
    console.error(
      'MetaMetricsController is not an object in state:',
      typeof metaMetricsState,
    );
    return null;
  }

  // User hasn't opted in to MetaMetrics
  const { participateInMetaMetrics, metaMetricsId } = metaMetricsState;
  if (participateInMetaMetrics !== true) {
    return null;
  }

  // Validate metaMetricsId is a string.
  // If it's missing (undefined/null), that's expected - user hasn't set up MetaMetrics.
  // Only log an error if it exists but has an unexpected type.
  if (typeof metaMetricsId !== 'string') {
    if (metaMetricsId !== undefined && metaMetricsId !== null) {
      console.error(
        'metaMetricsId has unexpected type in state:',
        typeof metaMetricsId,
      );
    }
    return null;
  }

  return metaMetricsId;
}

/**
 * Arguments for tracking an early Segment event.
 */
type EarlySegmentEventArgs = {
  /**
   * Partial state object that may contain MetaMetricsController state.
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
 * Tracks an event directly to Segment using MetaMetrics consent and ID from
 * a partial state object.
 *
 * @param segmentEventArgs - The arguments for tracking the event.
 * @param segmentEventArgs.state - Partial state object that may contain MetaMetricsController state.
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
  const metaMetricsId = getMetaMetricsFromState(state);

  // Don't track if user hasn't opted in to MetaMetrics
  if (!metaMetricsId) {
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
      userId: metaMetricsId,
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
