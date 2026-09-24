import type { AnalyticsEvent } from '../../../../shared/lib/analytics/create-event-builder';
import { createEvent } from '../../../../shared/lib/deep-links/metrics';
import type { ParsedDeepLink } from '../../../../shared/lib/deep-links/parse';

type TrackDeepLinkNavigationOptions = {
  canSubmitAnalytics: () => boolean;
  parsed: ParsedDeepLink;
  setContinuityIdForTab: (tabId: number) => string;
  tabId: number;
  trackEvent: (event: AnalyticsEvent) => void;
  url: URL;
};

/**
 * Tracks a completed deep-link navigation when analytics are enabled.
 *
 * @param options - The navigation details and analytics dependencies.
 * @param options.canSubmitAnalytics
 * @param options.parsed
 * @param options.setContinuityIdForTab
 * @param options.tabId
 * @param options.trackEvent
 * @param options.url
 */
export function trackDeepLinkNavigation({
  canSubmitAnalytics,
  parsed,
  setContinuityIdForTab,
  tabId,
  trackEvent,
  url,
}: TrackDeepLinkNavigationOptions): void {
  if (!canSubmitAnalytics()) {
    return;
  }

  const continuityId = parsed.destination.trackContinuity
    ? setContinuityIdForTab(tabId)
    : undefined;

  trackEvent(
    createEvent({
      continuityId,
      signature: parsed.signature,
      url,
    }),
  );
}
