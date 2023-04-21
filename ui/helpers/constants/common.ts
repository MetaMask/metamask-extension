export const PRIMARY = 'PRIMARY';
export const SECONDARY = 'SECONDARY';

let _supportRequestLink = 'https://metamask.zendesk.com/hc/en-us';
const _contractAddressLink =
  'https://metamask.zendesk.com/hc/en-us/articles/360020028092-What-is-the-known-contract-address-warning-';

///: BEGIN:ONLY_INCLUDE_IN(flask)
_supportRequestLink =
  'https://metamask-flask.zendesk.com/hc/en-us/requests/new';
///: END:ONLY_INCLUDE_IN

///: BEGIN:ONLY_INCLUDE_IN(mmi)
_supportRequestLink = 'https://mmi-support.zendesk.com/hc/en-us/requests/new';
export const SUPPORT_LINK = 'https://mmi-support.zendesk.com/hc/en-us';
export const MMI_WEB_SITE = 'https://metamask.io/institutions/';
///: END:ONLY_INCLUDE_IN

export const SUPPORT_REQUEST_LINK = _supportRequestLink;
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
