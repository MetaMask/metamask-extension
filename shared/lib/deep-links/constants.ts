// no destructuring as process.env detection stops working
export const DEEP_LINK_HOST = process.env.DEEP_LINK_HOST ?? 'link.metamask.io';
export const DEEP_LINK_MAX_LENGTH = 2048;
export const SIG_PARAM = 'sig';
export const SIG_PARAMS_PARAM = 'sig_params';

// Internal page that receives `/buy` deep link params and routes into the
// in-app unified buy flow (registered in the UI as RAMPS_BUY_DEEP_LINK_ENTRY_ROUTE).
export const RAMPS_BUY_DEEP_LINK_ENTRY_PATH = '/ramps/buy-deeplink-entry';
