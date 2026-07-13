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
  trackPage,
  updateProfileSessionData,
  validateIdentifyPayload,
} from './analytics';
