import {
  changeUser,
  destroy,
  dismissBanner,
  getBanner,
  getUser,
  initialize,
  isInitialized,
  logBannerClick,
  logBannerImpressions,
  logCustomEvent,
  removeSubscription,
  requestBannersRefresh,
  requestImmediateDataFlush,
  subscribeToBannersEvents,
  wipeData,
} from '@braze/web-sdk';

/**
 * The Braze SDK surface used by the Braze host. Loaded on demand, and named
 * imports let webpack tree-shake unused SDK features out of the chunk.
 */
export const brazeSdk = {
  changeUser,
  destroy,
  dismissBanner,
  getBanner,
  getUser,
  initialize,
  isInitialized,
  logBannerClick,
  logBannerImpressions,
  logCustomEvent,
  removeSubscription,
  requestBannersRefresh,
  requestImmediateDataFlush,
  subscribeToBannersEvents,
  wipeData,
};

export type BrazeSdk = typeof brazeSdk;

export type BrazeSdkBanner = NonNullable<ReturnType<BrazeSdk['getBanner']>>;

export type BrazeSdkBannersEvent = Parameters<
  Parameters<BrazeSdk['subscribeToBannersEvents']>[0]
>[0];
