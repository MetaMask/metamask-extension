/* global jest -- Global defined by Jest */
/**
 * Stub for `@braze/web-sdk`. The real package is ESM and talks to the network;
 * unit and integration tests must not load it.
 */

export const initialize = jest.fn().mockReturnValue(true);
export const changeUser = jest.fn();
export const wipeData = jest.fn();
export const subscribeToBannersEvents = jest.fn();
export const requestBannersRefresh = jest.fn();
export const removeSubscription = jest.fn();
export const logBannerImpressions = jest.fn();
export const logBannerClick = jest.fn();
export const dismissBanner = jest.fn();
export const logCustomEvent = jest.fn();
export const requestImmediateDataFlush = jest.fn();
export const ChannelEventType = {
  CACHE_REPLAY: 'CACHE_REPLAY',
  CACHE_LOAD: 'CACHE_LOAD',
  DATA_UPDATED: 'DATA_UPDATED',
  IMPRESSION: 'IMPRESSION',
  CLICK: 'CLICK',
  DISMISS: 'DISMISS',
  ERROR: 'ERROR',
};
export const ChannelErrorReason = {
  FEATURE_DISABLED: 'FEATURE_DISABLED',
  CLIENT_ERROR: 'CLIENT_ERROR',
};
export const RetryState = {
  DO_NOT_RETRY: 'DO_NOT_RETRY',
  SDK_WILL_RETRY: 'SDK_WILL_RETRY',
};
