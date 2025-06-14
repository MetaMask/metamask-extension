import type { UITrackEventMethod } from '../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';

/**
 * Tracks the viewing of a deep link interstitial.
 *
 * @param trackEvent - The tracking event method.
 * @param route - The parameters for the tracking event.
 * @param route.url
 * @param route.signed
 * @returns A promise that resolves when the tracking event is complete.
 */
export async function trackView(
  trackEvent: UITrackEventMethod,
  { url, signed }: { url: URL; signed: boolean },
) {
  const utmParams: Record<string, string> = {};
  const sensitiveProperties: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith('utm_')) {
      utmParams[key] = value;
    } else {
      sensitiveProperties[key] = value;
    }
  }

  return await trackEvent({
    category: MetaMetricsEventCategory.DeepLink,
    event: MetaMetricsEventName.DeepLinkInterstitialViewed,
    properties: {
      route: url.pathname,
      signed,
      utmParams,
    },
    sensitiveProperties,
  });
}
