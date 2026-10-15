/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { SentryTracingService } from './sentry-tracing-service';

/**
 * Start a trace immediately when metrics are enabled, or buffer it until the
 * user opts in.
 *
 * @param request - The trace request.
 */
export type SentryTracingServiceBufferedTraceAction = {
  type: `SentryTracingService:bufferedTrace`;
  handler: SentryTracingService['bufferedTrace'];
};

/**
 * End a trace immediately when metrics are enabled, or buffer it until the
 * user opts in.
 *
 * @param request - The end trace request.
 */
export type SentryTracingServiceBufferedEndTraceAction = {
  type: `SentryTracingService:bufferedEndTrace`;
  handler: SentryTracingService['bufferedEndTrace'];
};

/**
 * Track all traces buffered before the user opted into metrics.
 */
export type SentryTracingServiceTrackTracesAfterMetricsOptInAction = {
  type: `SentryTracingService:trackTracesAfterMetricsOptIn`;
  handler: SentryTracingService['trackTracesAfterMetricsOptIn'];
};

/**
 * Clear all traces buffered before the user made a consent decision.
 */
export type SentryTracingServiceClearTracesAfterMetricsOptInAction = {
  type: `SentryTracingService:clearTracesAfterMetricsOptIn`;
  handler: SentryTracingService['clearTracesAfterMetricsOptIn'];
};

/**
 * Union of all SentryTracingService action types.
 */
export type SentryTracingServiceMethodActions =
  | SentryTracingServiceBufferedTraceAction
  | SentryTracingServiceBufferedEndTraceAction
  | SentryTracingServiceTrackTracesAfterMetricsOptInAction
  | SentryTracingServiceClearTracesAfterMetricsOptInAction;
