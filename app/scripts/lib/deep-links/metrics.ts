import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  type MetaMetricsEventPayload,
} from '../../../../shared/constants/metametrics';
import type { SignatureStatus } from '../../../../shared/lib/deep-links/verify';

type UTMParameter =
  | 'utm_campaign'
  | 'utm_content'
  | 'utm_medium'
  | 'utm_source'
  | 'utm_term';

const UTM_PARAMETERS = new Set([
  'utm_campaign',
  'utm_content',
  'utm_medium',
  'utm_source',
  'utm_term',
]) as Set<UTMParameter> & { has: (key: string) => key is UTMParameter };

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

    if (key === 'attributionId') {
      properties.attribution_id = value;
    } else if (UTM_PARAMETERS.has(key)) {
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
