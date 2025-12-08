import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  type MetaMetricsEventPayload,
} from '../../../../shared/constants/metametrics';
import { TrackingParameter } from '../../../../shared/lib/deep-links/constants';
import type { SignatureStatus } from '../../../../shared/lib/deep-links/verify';

export type Properties = {
  route: string;
  signature: SignatureStatus;
} & { [key in TrackingParameter]?: string };

export type EventDetails = {
  url: URL;
  signature: SignatureStatus;
};

/**
 * Creates a trackable Event Payload representing deep link usage.
 *
 * If the route has query params, and the query params have duplicate keys,
 * only the last value will be used in the properties.
 *
 * @param route - The parameters for the tracking event.
 * @param route.url - The original full URL of the deep link.
 * @param route.signature - Whether the deep link has a signature, and if it is
 * valid.
 */
export function createEvent({ signature, url }: EventDetails) {
  const properties: Properties = {
    route: url.pathname,
    signature,
  };
  const sensitiveProperties: Record<string, string> = {};

  for (const [key, value] of url.searchParams.entries()) {
    if (key === 'sig') {
      // don't need to include the signature itself in the properties, utm
      // params are much more useful, so `sig` would be redundant.
      continue;
    }

    if (TRACKING_PARAMETERS.has(key)) {
      properties[key] = value;
    } else {
      sensitiveProperties[key] = value;
    }
  }

  return {
    category: MetaMetricsEventCategory.DeepLink as const,
    event: MetaMetricsEventName.DeepLinkUsed as const,
    properties,
    sensitiveProperties,
  } satisfies MetaMetricsEventPayload;
}
