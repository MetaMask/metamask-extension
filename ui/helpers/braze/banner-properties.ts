import type { Banner } from '@braze/web-sdk';

/**
 * Campaign content for the native React renderer; Braze HTML is never rendered.
 * @param banner
 */
export function getBrazeBannerContent(banner: Banner) {
  return {
    campaignName: banner.getStringProperty('campaign_name'),
    variantName: banner.getStringProperty('variant_name'),
    title: banner.getStringProperty('title'),
    body: banner.getStringProperty('body'),
    imageUrl:
      banner.getImageProperty('image_url') ??
      banner.getStringProperty('image_url'),
    ctaLabel: banner.getStringProperty('cta_label'),
    deeplink: banner.getStringProperty('deeplink'),
  };
}

/**
 * Mobile-compatible properties for campaign display and dismissal targeting.
 * @param banner
 */
export function getBrazeBannerEventProperties(banner: Banner) {
  const { campaignName, variantName } = getBrazeBannerContent(banner);
  return campaignName
    ? {
        // Campaign keys are defined by the shared Braze dashboard contract.
        // eslint-disable-next-line @typescript-eslint/naming-convention
        campaign_name: campaignName,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ...(variantName ? { variant_name: variantName } : {}),
      }
    : null;
}
