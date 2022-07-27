export const ETH = 'ETH';
export const GWEI = 'GWEI';
export const WEI = 'WEI';

export const PRIMARY = 'PRIMARY';
export const SECONDARY = 'SECONDARY';

export const GAS_ESTIMATE_TYPES = {
  SLOW: 'SLOW',
  AVERAGE: 'AVERAGE',
  FAST: 'FAST',
  FASTEST: 'FASTEST',
};

let _supportLink = 'https://support.metamask.io';
let _supportRequestLink = 'https://metamask.zendesk.com/hc/en-us/requests/new';
const _contractAddressLink =
  'https://metamask.zendesk.com/hc/en-us/articles/360020028092-What-is-the-known-contract-address-warning-';

///: BEGIN:ONLY_INCLUDE_IN(flask)
_supportLink = 'https://metamask-flask.zendesk.com/hc';
_supportRequestLink =
  'https://metamask-flask.zendesk.com/hc/en-us/requests/new';
///: END:ONLY_INCLUDE_IN

export const SUPPORT_LINK = _supportLink;
export const SUPPORT_REQUEST_LINK = _supportRequestLink;
export const CONTRACT_ADDRESS_LINK = _contractAddressLink;
