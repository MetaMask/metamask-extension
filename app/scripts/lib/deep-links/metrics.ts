import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';

/**
 * Creates a trackable Event Payload representing deep link usage.
 *
 * @param route - The parameters for the tracking event.
 * @param route.url - The original full URL of the deep link.
 * @param route.signed - Whether the deep link has a valid signature.
 */
export function createEvent({ url, signed }: { url: URL; signed: boolean }) {
  let attributionId: string | undefined;
  const utm: Record<string, string> = {};
  const sensitiveProperties: Record<string, string> = {};
  for (const [key, value] of url.searchParams.entries()) {
    if (key === 'attribution_id') {
      attributionId = value;
    } else if (key.startsWith('utm_')) {
      utm[key] = value;
    } else {
      sensitiveProperties[key] = value;
    }
  }

  return {
    category: MetaMetricsEventCategory.DeepLink,
    event: MetaMetricsEventName.DeepLinkUsed,
    properties: {
      route: url.pathname,
      attribution_id: attributionId,
      is_signature_valid: signed,
      utm,
    },
    sensitiveProperties,
  };
}
