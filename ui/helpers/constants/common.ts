export const PRIMARY = 'PRIMARY';
export const SECONDARY = 'SECONDARY';

const _contractAddressLink =
  'https://metamask.zendesk.com/hc/en-us/articles/360020028092-What-is-the-known-contract-address-warning-';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
const _mmiWebSite = 'https://metamask.io/institutions/';
export const MMI_WEB_SITE = _mmiWebSite;
///: END:ONLY_INCLUDE_IF

// eslint-disable-next-line prefer-destructuring
export const SUPPORT_REQUEST_LINK = process.env.SUPPORT_REQUEST_LINK;
export const CONTRACT_ADDRESS_LINK = _contractAddressLink;
export const PASSWORD_MIN_LENGTH = 8;
export const OUTDATED_BROWSER_VERSIONS = {
  // Chrome and Edge should match the latest Chrome version released ~2 years ago
  chrome: '<90',
  edge: '<90',
  // Firefox should match the most recent end-of-life extended support release
  firefox: '<91',
  // Opera should be set to the equivalent of the Chrome version set
  // See https://en.wikipedia.org/wiki/History_of_the_Opera_web_browser
  opera: '<76',
};
export const BROKEN_PRERENDER_BROWSER_VERSIONS = {
  // https://issues.chromium.org/issues/40273420
  chrome: '>=113',
  edge: '>=113',
};
export const FIXED_PRERENDER_BROWSER_VERSIONS = {
  // https://chromium.googlesource.com/chromium/src/+/a88eee8a2798c1dc4d69b255ccad24fea5ff2d8b
  // https://chromiumdash.appspot.com/commits?commit=a88eee8a2798c1dc4d69b255ccad24fea5ff2d8b&platform=Windows
  // https://chromiumdash.appspot.com/commits?commit=a88eee8a2798c1dc4d69b255ccad24fea5ff2d8b&platform=Mac
  // https://chromiumdash.appspot.com/commits?commit=a88eee8a2798c1dc4d69b255ccad24fea5ff2d8b&platform=Linux
  chrome: '>=121',
  edge: '>=121',
};
