import { getReferralCode } from '#shared/lib/deep-links/referral';
import { createEventBuilder } from '../analytics/create-event-builder';
import type { AnalyticsEvent } from '../analytics/create-event-builder';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../constants/metametrics';
import { UTM_PARAMETERS, type UTMParameter } from '../../types/metametrics';
import type { ParsedDeepLink } from './parse';
import type { SignatureStatus } from './verify';

export type Properties = {
  route: string;
  signature: SignatureStatus;
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  attribution_id?: string;
  referral?: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- analytics property
  referral_code?: string;
} & { [key in UTMParameter]?: string };

export type EventDetails = {
  url: URL;
  signature: SignatureStatus;
};

/**
 * Determines whether a parsed deep-link navigation should be tracked.
 *
 * Destinations that redirect outside the extension are excluded because the
 * extension does not handle the resulting navigation.
 *
 * @param parsed - The parsed deep-link destination.
 * @param parsed.destination
 * @returns Whether the navigation should produce a deep-link analytics event.
 */
export function shouldTrackDeepLinkNavigation({
  destination,
}: Pick<ParsedDeepLink, 'destination'>): boolean {
  return !('redirectTo' in destination);
}

/**
 * Creates a trackable analytics event representing deep link usage.
 *
 * Repeated parameters use the last value, except `ref`, which must be unique.
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
    // eslint-disable-next-line @typescript-eslint/naming-convention -- analytics property
    referral_code: getReferralCode(url.searchParams) ?? undefined,
  };
  const sensitiveProperties: Record<string, string> = {};

  for (const [key, value] of url.searchParams.entries()) {
    if (key === 'sig' || key === 'ref') {
      // Signatures are redundant; referral metadata is handled above.
      continue;
    }

    if (key === 'attributionId') {
      properties.attribution_id = value;
    } else if (key === 'referral') {
      // Referral codes are public (partners share them openly), so they are
      // tracked as a standard attribution property, not a sensitive one.
      properties.referral = value;
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
