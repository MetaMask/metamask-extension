import { AnalyticsEventBuilder } from './analytics-event-builder';

export {
  AnalyticsEventBuilder,
  buildPageViewPayload,
  type AnalyticsEventBuildOptions,
  type BuiltAnalyticsEvent,
  type BuiltPageViewPayload,
} from './analytics-event-builder';
export { configureAnalyticsEventBuilder } from './analytics-event-builder-init';
export type { AnalyticsEventBuilderMessenger } from './analytics-event-builder-messenger';
export {
  canSubmitAnalytics,
  configureAnalyticsDelivery,
  identify,
  trackEvent,
  trackView,
  validateIdentifyPayload,
} from './analytics-delivery';

export const createEventBuilder = AnalyticsEventBuilder.createEventBuilder.bind(
  AnalyticsEventBuilder,
);
