import { defineAllowedRouteCapabilities } from '../../../helpers/route-messenger-helpers';
import type { RouteMessengerFromCapabilities } from '../../../messengers/route-messenger';

/**
 * Actions the Braze banner may call on BrazeService.
 */
export const BRAZE_BANNER_ALLOWED_CAPABILITIES = defineAllowedRouteCapabilities(
  {
    actions: [
      'BrazeService:getBanner',
      'BrazeService:logBannerImpression',
      'BrazeService:logBannerClick',
      'BrazeService:dismissBanner',
    ],
    events: [],
  },
);

export type BrazeBannerMessenger = RouteMessengerFromCapabilities<
  typeof BRAZE_BANNER_ALLOWED_CAPABILITIES
>;
