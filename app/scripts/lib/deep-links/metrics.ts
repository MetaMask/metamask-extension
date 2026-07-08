import { createEventBuilder } from '../../../../shared/lib/analytics/create-event-builder';
import type { AnalyticsEvent } from '../../../../shared/lib/analytics/create-event-builder';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import type { SignatureStatus } from '../../../../shared/lib/deep-links/verify';
import {
  type UTMParameter,
  UTM_PARAMETERS,
} from '../../../../shared/types/metametrics';

export type Properties = {
  route: string;
  signature: SignatureStatus;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  attribution_id?: string;
} & { [key in UTMParameter]?: string };

export type EventDetails = {
  url: URL;
  signature: SignatureStatus;
};

/**
 * Creates a trackable analytics event representing deep link usage.
 *
 * If the route has query params, and the query params have duplicate keys,
 * only the last value will be used in the properties.
 *
 * @param route - The parameters for the tracking event.
 * @param route.url - The original full URL of the deep link.
 * @param route.signature - Whether the deep link has a signature, and if it is
 * valid.
 */
export function createEvent({ signature, url }: EventDetails): AnalyticsEvent {
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

    if (key === 'attributionId') {
      properties.attribution_id = value;
    } else if (UTM_PARAMETERS.has(key)) {
      properties[key] = value;
    } else {
      sensitiveProperties[key] = value;
    }
  }

  return createEventBuilder(MetaMetricsEventName.DeepLinkUsed)
    .addCategory(MetaMetricsEventCategory.DeepLink)
    .addProperties(properties)
    .addSensitiveProperties(sensitiveProperties)
    .build();
}
