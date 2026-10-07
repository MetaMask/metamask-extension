import * as braze from '@braze/web-sdk';
import { captureException } from '../../../shared/lib/sentry';
import { getBrazeBannerEventProperties } from './banner-properties';

/**
 * Logs an SDK impression and Mobile's targeting event for custom banner UI.
 *
 * @param banner - The campaign currently rendered.
 */
export function logBrazeBannerImpression(banner: braze.Banner): void {
  try {
    braze.logBannerImpressions([banner.placementId]);
    const properties = getBrazeBannerEventProperties(banner);
    if (properties) {
      braze.logCustomEvent('Banner Display', properties);
    }
  } catch (error) {
    captureException(error);
  }
}

/**
 * Lets the SDK own dismissal persistence and campaign re-eligibility.
 * The custom event matches Mobile's next-campaign targeting contract.
 *
 * @param banner - The campaign dismissed by the user.
 */
export function dismissBrazeBanner(banner: braze.Banner): void {
  try {
    braze.dismissBanner(banner);
    const properties = getBrazeBannerEventProperties(banner);
    if (properties) {
      braze.logCustomEvent('Banner Dismissed', properties);
      braze.requestImmediateDataFlush();
    }
  } catch (error) {
    captureException(error);
  }
}
