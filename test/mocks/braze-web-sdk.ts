/**
 * Keep unrelated tests from activating Braze. Lifecycle tests use the real SDK
 * with network I/O mocked at the browser boundary.
 */

export const initialize = jest.fn().mockReturnValue(true);
export const isInitialized = jest.fn().mockReturnValue(false);
export const getUser = jest.fn();
export const changeUser = jest.fn();
export const requestImmediateDataFlush = jest.fn();
export const destroy = jest.fn();
export const wipeData = jest.fn();
export const getBanner = jest.fn();
export const requestBannersRefresh = jest.fn();
export const subscribeToBannersEvents = jest.fn();
export const removeSubscription = jest.fn();
export const logBannerImpressions = jest.fn();
export const logBannerClick = jest.fn();
export const dismissBanner = jest.fn();
export const logCustomEvent = jest.fn();
