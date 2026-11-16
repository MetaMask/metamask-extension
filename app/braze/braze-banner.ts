import type { BrazeBanner } from '../../shared/lib/braze';
import { DEEP_LINK_HOSTS } from '../../shared/lib/deep-links/common';
import type { BrazeSdkBanner } from './braze-sdk';

function getTrimmedStringProperty(
  banner: BrazeSdkBanner,
  key: string,
): string | null {
  return banner.getStringProperty(key)?.trim() || null;
}

function isHttpsUrl(href: string): boolean {
  try {
    return new URL(href).protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Whether a campaign link may be opened. Only MetaMask universal links are
 * allowed, so every banner click goes through the deep-link router and its
 * interstitial instead of opening an arbitrary site.
 *
 * @param href - The campaign link.
 * @returns True for an `https` link on a configured deep-link host.
 */
export function isAllowedBrazeBannerLink(href: string): boolean {
  try {
    const url = new URL(href);
    return (
      url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.port &&
      DEEP_LINK_HOSTS.includes(url.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * Reduce an SDK banner to the fields the UI renders. See the component README
 * for the campaign properties contract.
 *
 * Unsupported values are dropped rather than rejected: an image that is not
 * `https` is omitted, and a link that is not allowed makes the banner
 * non-interactive.
 *
 * @param banner - The SDK banner.
 * @returns The banner, or `null` when there is none or it has no body.
 */
export function toBrazeBanner(
  banner: BrazeSdkBanner | null | undefined,
): BrazeBanner | null {
  if (!banner) {
    return null;
  }

  const { id, placementId, isControl } = banner;
  if (isControl) {
    return {
      id,
      placementId,
      isControl,
      title: null,
      body: null,
      imageUrl: null,
      ctaLabel: null,
      deeplink: null,
    };
  }

  const body = getTrimmedStringProperty(banner, 'body');
  if (!body) {
    return null;
  }

  const imageUrl =
    banner.getImageProperty('image_url') ??
    banner.getStringProperty('image_url');
  const deeplink = getTrimmedStringProperty(banner, 'deeplink');

  return {
    id,
    placementId,
    isControl,
    title: getTrimmedStringProperty(banner, 'title'),
    body,
    imageUrl: imageUrl && isHttpsUrl(imageUrl) ? imageUrl : null,
    ctaLabel: getTrimmedStringProperty(banner, 'cta_label'),
    deeplink: deeplink && isAllowedBrazeBannerLink(deeplink) ? deeplink : null,
  };
}

/**
 * Properties of the banner custom events, matching Mobile. Campaigns without
 * a `campaign_name` log no custom events.
 *
 * @param banner - The SDK banner.
 * @returns The event properties, or `undefined`.
 */
export function getBrazeBannerEventProperties(
  banner: BrazeSdkBanner,
): Record<string, string> | undefined {
  const campaignName = banner.getStringProperty('campaign_name');
  if (!campaignName) {
    return undefined;
  }

  const variantName = banner.getStringProperty('variant_name');
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    campaign_name: campaignName,
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ...(variantName ? { variant_name: variantName } : {}),
  };
}
