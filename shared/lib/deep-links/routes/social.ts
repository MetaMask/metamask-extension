import {
  DEEP_LINK_ORIGIN,
  createHomeQrCodeDestination,
  HomeQueryParams,
} from './home';
import { Route } from './route';

/**
 * Builds the home destination that opens the mobile QR modal for a Social
 * deeplink. The QR encodes the canonical `https://link.metamask.io` URL so
 * scanning continues on mobile.
 *
 * @param pathname - Social route pathname (`/social` or `/social/profile`).
 * @param params - Query parameters from the incoming deeplink.
 * @returns A home-route destination carrying the Social QR deeplink.
 */
function createSocialQrCodeDestination(
  pathname: '/social' | '/social/profile',
  params: URLSearchParams,
) {
  const deeplinkUrl = new URL(pathname, DEEP_LINK_ORIGIN);
  deeplinkUrl.search = params.toString();

  return createHomeQrCodeDestination(
    HomeQueryParams.SocialDeeplinkUrl,
    deeplinkUrl.toString(),
  );
}

/**
 * Deeplink for the MetaMask Social feed.
 *
 * Social is available only on mobile, so `/social` opens the open-on-mobile
 * QR modal. `tab` selects trending, following, leaderboard, or live trades
 * on mobile. Missing or unknown tabs are left unchanged; mobile falls back
 * to trending.
 *
 * Supported URL formats:
 * - https://link.metamask.io/social
 * - https://link.metamask.io/social?tab=trending
 * - https://link.metamask.io/social?tab=following
 * - https://link.metamask.io/social?tab=leaderboard
 * - https://link.metamask.io/social?tab=live-trades
 */
export const social = new Route({
  pathname: '/social',
  getTitle: (_: URLSearchParams) => 'deepLink_theSocialPage',
  handler: function handler(params: URLSearchParams) {
    return createSocialQrCodeDestination('/social', params);
  },
});

/**
 * Deeplink for a MetaMask Social profile.
 *
 * Profiles are available only on mobile. The QR preserves `traderId` so
 * scanning opens that profile on mobile.
 *
 * Supported URL formats:
 * - https://link.metamask.io/social/profile?traderId=<traderId>
 */
export const socialProfile = new Route({
  pathname: '/social/profile',
  getTitle: (_: URLSearchParams) => 'deepLink_theSocialProfilePage',
  handler: function handler(params: URLSearchParams) {
    return createSocialQrCodeDestination('/social/profile', params);
  },
});
