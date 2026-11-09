import {
  DEEP_LINK_ORIGIN,
  createHomeQrCodeDestination,
  HomeQueryParams,
} from './home';
import { Route } from './route';

type SocialDeeplinkPathname =
  | '/social'
  | '/social/post'
  | '/social/profile'
  | '/social/profile/position'
  | '/social-trader-position';

/**
 * Builds the home destination that opens the mobile QR modal for a Social
 * deeplink. The QR encodes the canonical `https://link.metamask.io` URL so
 * scanning continues on mobile.
 *
 * @param pathname - Social route pathname.
 * @param params - Query parameters from the incoming deeplink.
 * @returns A home-route destination carrying the Social QR deeplink.
 */
function createSocialQrCodeDestination(
  pathname: SocialDeeplinkPathname,
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

/**
 * Deeplink for a MetaMask Social position.
 *
 * Positions are available only on mobile. The QR preserves `positionId` and
 * `traderId` (and any other query params) so scanning opens that position
 * on mobile.
 *
 * Supported URL formats:
 * - https://link.metamask.io/social/profile/position?positionId=<positionId>&traderId=<traderId>
 */
export const socialProfilePosition = new Route({
  pathname: '/social/profile/position',
  getTitle: (_: URLSearchParams) => 'deepLink_theSocialPositionPage',
  handler: function handler(params: URLSearchParams) {
    return createSocialQrCodeDestination('/social/profile/position', params);
  },
});

/**
 * Deeplink for a MetaMask Social post.
 *
 * Posts are available only on mobile. The QR preserves `positionId` and
 * `traderId` so scanning opens that post on mobile.
 *
 * Supported URL formats:
 * - https://link.metamask.io/social/post?positionId=<positionId>&traderId=<traderId>
 */
export const socialPost = new Route({
  pathname: '/social/post',
  getTitle: (_: URLSearchParams) => 'deepLink_theSocialPostPage',
  handler: function handler(params: URLSearchParams) {
    return createSocialQrCodeDestination('/social/post', params);
  },
});

/**
 * Legacy deeplink for a MetaMask Social position.
 *
 * Mobile still accepts this path alongside `/social/profile/position`. The
 * QR keeps the legacy path and its query params.
 *
 * Supported URL formats:
 * - https://link.metamask.io/social-trader-position?positionId=<positionId>&traderId=<traderId>
 */
export const socialTraderPosition = new Route({
  pathname: '/social-trader-position',
  getTitle: (_: URLSearchParams) => 'deepLink_theSocialPositionPage',
  handler: function handler(params: URLSearchParams) {
    return createSocialQrCodeDestination('/social-trader-position', params);
  },
});
