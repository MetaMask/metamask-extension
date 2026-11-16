/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { BrazeService } from './braze-service';

/**
 * Get the banner for a placement.
 *
 * @param placementId - The placement ID.
 * @returns The banner, or `null` when there is none or the user is not
 * identified with Braze.
 */
export type BrazeServiceGetBannerAction = {
  type: `BrazeService:getBanner`;
  handler: BrazeService['getBanner'];
};

/**
 * Log that a banner was shown. Call it for control banners too, even though
 * they render nothing.
 *
 * @param placementId - The placement ID.
 * @param bannerId - The banner ID.
 */
export type BrazeServiceLogBannerImpressionAction = {
  type: `BrazeService:logBannerImpression`;
  handler: BrazeService['logBannerImpression'];
};

/**
 * Log that a banner was clicked.
 *
 * @param placementId - The placement ID.
 * @param bannerId - The banner ID.
 */
export type BrazeServiceLogBannerClickAction = {
  type: `BrazeService:logBannerClick`;
  handler: BrazeService['logBannerClick'];
};

/**
 * Dismiss a banner. Braze stops serving it to this user.
 *
 * @param placementId - The placement ID.
 * @param bannerId - The banner ID.
 */
export type BrazeServiceDismissBannerAction = {
  type: `BrazeService:dismissBanner`;
  handler: BrazeService['dismissBanner'];
};

/**
 * Union of all BrazeService action types.
 */
export type BrazeServiceMethodActions =
  | BrazeServiceGetBannerAction
  | BrazeServiceLogBannerImpressionAction
  | BrazeServiceLogBannerClickAction
  | BrazeServiceDismissBannerAction;
