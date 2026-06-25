import { createEventBuilder } from '../../../../shared/lib/analytics/create-event-builder';

export { createEventBuilder };
export type {
  AnalyticsEvent,
  AnalyticsEventBuildOptions,
  AnalyticsEventBuilder,
} from '../../../../shared/lib/analytics/create-event-builder';
export {
  configureAnalytics,
  canSubmitAnalytics,
  identify,
  trackEvent,
  trackLegacyMetaMetricsEvent,
  trackPage,
  validateIdentifyPayload,
} from './analytics';
export { getAnalyticsMessenger } from './analytics-messenger';
export type { AnalyticsMessenger } from './analytics-messenger';
