import { createEventBuilder } from '../../shared/lib/analytics/create-event-builder';

export function useAnalytics() {
  return {
    trackEvent: () => undefined,
    createEventBuilder,
  };
}
