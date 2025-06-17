import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

/**
 * Tracks the usage of a deep link interstitial.
 *
 * @param route - The parameters for the tracking event.
 * @param route.url - The original full URL of the deep link.
 * @param route.signed - Whether the deep link has a valid signature.
 * @returns A promise that resolves when the tracking event is complete.
 */
export async function createEvent({
  url,
  signed,
}: {
  url: URL;
  signed: boolean;
}) {
  const utm: Record<string, string> = {};
  let attributionId: string | undefined;
  const sensitiveProperties: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key.startsWith('utm_')) {
      utm[key] = value;
    } else if (key === 'attribution_id') {
      attributionId = value;
    } else {
      sensitiveProperties[key] = value;
    }
  }

  return {
    category: MetaMetricsEventCategory.DeepLink,
    event: MetaMetricsEventName.DeepLinkUsed,
    properties: {
      route: url.pathname,
      is_signature_valid: signed,
      attribution_id: attributionId,
      utm,
    },
    sensitiveProperties,
  };
}
