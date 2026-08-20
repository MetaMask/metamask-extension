import {
  createEventBuilder,
  type AnalyticsEvent,
} from '../../shared/lib/analytics/create-event-builder';

export function useAnalytics() {
  return {
    trackEvent: (_built: AnalyticsEvent) => undefined,
    createEventBuilder,
  };
}
