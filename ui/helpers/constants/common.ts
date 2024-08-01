export const PRIMARY = 'PRIMARY';
export const SECONDARY = 'SECONDARY';

const _contractAddressLink =
  'https://support.metamask.io/managing-my-tokens/moving-your-tokens/why-am-i-being-warned-about-sending-tokens-to-a-contract/';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
const _mmiWebSite = 'https://metamask.io/institutions/';
export const MMI_WEB_SITE = _mmiWebSite;
///: END:ONLY_INCLUDE_IF

// eslint-disable-next-line prefer-destructuring
export const METAMETRICS_SETTINGS_LINK =
  'https://support.metamask.io/privacy-and-security/how-to-manage-your-metametrics-settings';
// eslint-disable-next-line prefer-destructuring
export const SUPPORT_REQUEST_LINK = process.env.SUPPORT_REQUEST_LINK;
export const CONTRACT_ADDRESS_LINK = _contractAddressLink;
export const PASSWORD_MIN_LENGTH = 8;
export const OUTDATED_BROWSER_VERSIONS = {
  // Chrome and Edge should match the latest Chrome version released ~2 years ago,
  // or the earliest version that supports our MV3 functionality, whichever is higher
  chrome: '<109',
  edge: '<109',
  // Firefox should match the previous extended support release
  // Current ESR: 115
  // Previous ESR: 102
  firefox: '<102',
  // Opera versions correspond to differently numbered Chromium versions.
  // Opera should be set to the equivalent of the Chromium version set
  // Opera 95 is based on Chromium 109
  // See https://en.wikipedia.org/wiki/History_of_the_Opera_web_browser
  opera: '<95',
};

/**
 * Specifies the browser and their versions where a regression in the extension port
 * stream established between the contentscript and background was breaking for
 * prerendered pages.
 *
 * @see {@link https://issues.chromium.org/issues/40273420}
 */
export const BROKEN_PRERENDER_BROWSER_VERSIONS = {
  chrome: '>=113',
  edge: '>=113',
};

/**
 * Specifies the browser and their versions on a specific OS where a fix for the
 * prerender regression specified in BROKEN_PRERENDER_BROWSER_VERSIONS was resolved.
 *
 * @see {@link https://chromium.googlesource.com/chromium/src/+/a88eee8a2798c1dc4d69b255ccad24fea5ff2d8b}
 */
export const FIXED_PRERENDER_BROWSER_VERSIONS = {
  // https://chromiumdash.appspot.com/commits?commit=a88eee8a2798c1dc4d69b255ccad24fea5ff2d8b&platform=Windows
  windows: {
    chrome: '>=120',
    edge: '>=120',
  },
  // https://chromiumdash.appspot.com/commits?commit=a88eee8a2798c1dc4d69b255ccad24fea5ff2d8b&platform=Mac
  macos: {
    chrome: '>=120',
    edge: '>=120',
  },
  // https://chromiumdash.appspot.com/commits?commit=a88eee8a2798c1dc4d69b255ccad24fea5ff2d8b&platform=Linux
  chrome: '>=121',
  edge: '>=121',
};
