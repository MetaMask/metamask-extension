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
  createEventFragment,
  finalizeEventFragment,
  getEventFragmentById,
  identify,
  setParticipateInMetaMetrics,
  trackEvent,
  trackPage,
  updateEventFragment,
  updateProfileSessionData,
  upsertEventFragment,
  validateIdentifyPayload,
} from './analytics';
