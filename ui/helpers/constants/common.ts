export const PRIMARY = 'PRIMARY';
export const SECONDARY = 'SECONDARY';

const _contractAddressLink =
  'https://metamask.zendesk.com/hc/en-us/articles/360020028092-What-is-the-known-contract-address-warning-';

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
  // Firefox should match the most recent end-of-life extended support release
  firefox: '<91',
  // Opera versions correspond to differently numbered Chromium versions.
  // Opera should be set to the equivalent of the Chromium version set
  // Opera 95 is based on Chromium 109
  // See https://en.wikipedia.org/wiki/History_of_the_Opera_web_browser
  opera: '<95',
};
